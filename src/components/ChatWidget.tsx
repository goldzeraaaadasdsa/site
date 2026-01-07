import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const wsUrl = () => {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}`;
};

interface Message { from: 'user' | 'admin'; text: string; ts: string; author?: string }

const ChatWidget: React.FC<{ open: boolean; onClose: () => void; initialName?: string }> = ({ open, onClose, initialName }) => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const [assignedAdmin, setAssignedAdmin] = useState<string | null>(null);
  const [adminTyping, setAdminTyping] = useState<boolean>(false);
  const [hasAdmins, setHasAdmins] = useState<boolean>(false);
  const typingTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    async function createChat() {
      console.log('ChatWidget mounted (open)');
      try {
        const nameToSend = initialName || (user ? (user.displayName || user.username) : 'Anônimo');
        const emailToSend = user?.email || null;
        
        // Check if we already have a chat ID stored locally
        let chatIdToUse = localStorage.getItem('current_chat_id');
        let existingMessages: Message[] = [];
        
        if (chatIdToUse) {
          // Try to load existing chat from server
          try {
            const existingRes = await fetch(`/api/chats/${chatIdToUse}`, {});
            if (existingRes.ok) {
              const existingChat = await existingRes.json();
              existingMessages = existingChat.messages || [];
              setMessages(existingMessages);
            }
          } catch (e) {
            // If server fails, try localStorage
            try {
              const localData = JSON.parse(localStorage.getItem(`chat_${chatIdToUse}`) || '{}');
              existingMessages = localData.messages || [];
              setMessages(existingMessages);
            } catch (e2) {}
          }
        } else {
          // Create new chat
          const resp = await fetch('/api/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nameToSend, email: emailToSend }) });
          const data = await resp.json();
          chatIdToUse = data.id;
          localStorage.setItem('current_chat_id', chatIdToUse);
        }
        
        if (!mounted) return;
        setChatId(chatIdToUse);
        
        // open ws
        const ws = new WebSocket(wsUrl());
        wsRef.current = ws;
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'subscribe', chatId: chatIdToUse, role: 'user' }));
        };
        ws.onmessage = (ev) => {
          try{
            const d = JSON.parse(ev.data);
            if(d.type === 'init' && d.chat) {
              setMessages(d.chat.messages || []);
              if(d.chat.assignedAdmin) setAssignedAdmin(d.chat.assignedAdmin);
              // Save to localStorage
              try {
                localStorage.setItem(`chat_${chatIdToUse}`, JSON.stringify(d.chat));
              } catch (e) {}
            }
            if(d.type === 'message' && d.message){
              setMessages(prev => {
                const updated = [...prev, d.message];
                // Save updated messages to localStorage
                try {
                  const chatData = JSON.parse(localStorage.getItem(`chat_${chatIdToUse}`) || '{}');
                  chatData.messages = updated;
                  localStorage.setItem(`chat_${chatIdToUse}`, JSON.stringify(chatData));
                } catch (e) {}
                return updated;
              });
              if(d.message.author) setAssignedAdmin(d.message.author);
            }
            if(d.type === 'typing'){
              // typing from admin
              if(d.from === 'admin') setAdminTyping(!!d.typing);
            }
            if(d.type === 'presence'){
              // presence info (adminCount)
              if(d.adminCount && d.adminCount > 0) setHasAdmins(true); else setHasAdmins(false);
            }
          }catch(e){}
        };
      } catch (e) {
        console.error('chat create error', e);
      }
    }

    createChat();
    return () => { mounted = false; if (wsRef.current){ wsRef.current.close(); wsRef.current = null; } };
  }, [open]);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

  const send = async () => {
    if (!text.trim() || !chatId) return;
    const body = { text: text.trim(), from: 'user' };
    setText('');
    try {
      const res = await fetch(`/api/chats/${chatId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const messageData = await res.json();
        // Update local state and localStorage immediately
        if (messageData.message) {
          setMessages(prev => {
            const updated = [...prev, messageData.message];
            // Save to localStorage
            try {
              const chatData = JSON.parse(localStorage.getItem(`chat_${chatId}`) || '{}');
              chatData.messages = updated;
              localStorage.setItem(`chat_${chatId}`, JSON.stringify(chatData));
            } catch (e) {}
            return updated;
          });
        }
      }
      // notify server we stopped typing
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try{ wsRef.current.send(JSON.stringify({ type: 'typing', chatId, typing: false, role: 'user' })); }catch(e){}
      }
    } catch (e) { console.error(e); }
  };

  const sendTyping = (typing: boolean) => {
    if (!chatId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try{ wsRef.current.send(JSON.stringify({ type: 'typing', chatId, typing, role: 'user' })); }catch(e){}
    }
  };

  const handleInputChange = (val: string) => {
    setText(val);
    // send typing true and debounce stop
    sendTyping(true);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => { sendTyping(false); typingTimer.current = null; }, 2000);
  };

  if (!open) return null;

  const userDisplay = initialName || (user ? (user.displayName || user.username) : 'Anônimo');

  return (
    <div className="fixed right-4 bottom-4 w-96 bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col" role="dialog" aria-label="Chat de suporte">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">{(userDisplay||'A').charAt(0)}</div>
          <div>
            <div className="font-semibold">{userDisplay}</div>
            <div className="text-xs text-muted-foreground">{assignedAdmin ? `Atendente: ${assignedAdmin}` : 'Aguardando atendente...'}</div>
          </div>
        </div>
        <div className="space-x-2">
          <button className="text-sm text-muted-foreground" onClick={onClose}>Fechar</button>
        </div>
      </div>

      <div ref={listRef} className="p-3 flex-1 overflow-auto space-y-3" style={{ maxHeight: '420px' }}>
        {messages.length === 0 && <div className="text-sm text-muted-foreground">Conectando ao suporte...</div>}
        {messages.map((m, idx) => (
          <div key={idx} className={`p-3 rounded-md max-w-[80%] ${m.from === 'admin' ? 'bg-primary/5 self-start' : 'bg-muted/5 self-end'} relative`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">{(m.author || (m.from==='user' ? userDisplay : 'A')).charAt(0)}</div>
              <div className="text-xs font-medium">{m.author || (m.from==='user' ? 'Você' : 'Atendente')}</div>
            </div>
            <div className="text-sm">{m.text}</div>
            <div className="text-xs text-muted-foreground mt-2">{new Date(m.ts).toLocaleString()}</div>
          </div>
        ))}
        {adminTyping && (
          <div className="text-sm text-muted-foreground">Atendente está digitando...</div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input value={text} onChange={(e)=>handleInputChange(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 bg-transparent border border-border rounded px-3 py-2 text-sm" />
          <button onClick={send} className="bg-primary text-primary-foreground px-4 rounded">Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
