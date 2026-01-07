import React, { useEffect, useRef, useState } from 'react';
import ChatListItem from './ChatListItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Clock, User, Mail, X, Check, Trash2, Unlink, Copy, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message { from: 'user' | 'admin'; text: string; ts: string; author?: string }
interface Chat { id: string; name: string; email?: string | null; createdAt: string; messages: Message[]; status: string; assignedAdmin?: string; unread?: boolean }

const wsUrl = () => {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}`;
};

const AdminChats: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [active, setActive] = useState<Chat | null>(null);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'assigned' | 'unread' | 'anonymous' | 'users'>('all');
  const [sort, setSort] = useState<'recent' | 'oldest' | 'urgent'>('recent');
  const [userTyping, setUserTyping] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | null>(null);
  const { toast } = useToast();

  const loadList = async () => {
    const res = await fetch('/api/admin/chats', { credentials: 'include' });
    if (res.ok) { const data = await res.json(); setChats(data); }
  };

  useEffect(() => { loadList(); }, []);

  // Cleanup WebSocket and timers on unmount
  useEffect(() => {
    return () => {
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Clear typing timer
      if (typingTimer.current) {
        window.clearTimeout(typingTimer.current);
        typingTimer.current = null;
      }
    };
  }, []);

  // Filter and sort chats
  const filteredChats = chats
    .filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'open' && c.status !== 'open') return false;
      if (filter === 'closed' && c.status !== 'closed') return false;
      if (filter === 'assigned' && !c.assignedAdmin) return false;
      if (filter === 'unread' && !c.unread) return false;
      if (filter === 'anonymous' && c.name !== 'Anônimo' && c.email) return false;
      if (filter === 'users' && (c.name === 'Anônimo' || !c.email)) return false;
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      
      if (sort === 'recent') return bTime - aTime;
      if (sort === 'oldest') return aTime - bTime;
      
      // 'urgent' - não lidas há mais tempo aparecem primeiro
      if (sort === 'urgent') {
        const aLastMsg = (a.messages && a.messages.length > 0) ? new Date(a.messages[a.messages.length - 1].ts).getTime() : aTime;
        const bLastMsg = (b.messages && b.messages.length > 0) ? new Date(b.messages[b.messages.length - 1].ts).getTime() : bTime;
        const aDiff = Date.now() - aLastMsg;
        const bDiff = Date.now() - bLastMsg;
        return bDiff - aDiff; // mais antigos primeiro
      }
      
      return bTime - aTime;
    });

  const openChat = async (id: string) => {
    const res = await fetch(`/api/admin/chats/${id}`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    
    // Save chat data to localStorage for persistence
    try {
      const localChats = JSON.parse(localStorage.getItem('admin_chats') || '{}');
      localChats[id] = data;
      localStorage.setItem('admin_chats', JSON.stringify(localChats));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    
    setActive(data);
    setUserTyping(false);
    setAdminTyping(false);
    // mark as read
    if (data.unread) {
      try{ await fetch(`/api/admin/chats/${id}/mark-read`, { method: 'POST', credentials: 'include' }); }catch(e){}
    }
    // open ws and subscribe
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;
    ws.onopen = () => { ws.send(JSON.stringify({ type: 'subscribe', chatId: id, role: 'admin' })); };
    ws.onmessage = (ev) => {
      try{
        const d = JSON.parse(ev.data);
        if (d.type === 'init' && d.chat) {
          setActive(d.chat);
          // Update localStorage when chat is updated via WebSocket
          try {
            const localChats = JSON.parse(localStorage.getItem('admin_chats') || '{}');
            localChats[id] = d.chat;
            localStorage.setItem('admin_chats', JSON.stringify(localChats));
          } catch (e) {}
        }
        if (d.type === 'message' && d.message) setActive(prev => prev ? { ...prev, messages: [...(prev.messages||[]), d.message] } : prev);
        if (d.type === 'typing') { if (d.from === 'user') setUserTyping(!!d.typing); else setAdminTyping(!!d.typing); }
        if (d.type === 'presence') setAdminCount(d.adminCount || 0);
        if (d.type === 'assigned' || d.type === 'status') { setActive(prev => prev ? { ...prev, ...(d.assignedAdmin && { assignedAdmin: d.assignedAdmin }), ...(d.status && { status: d.status }) } : prev); }
      }catch(e){}
    };
  };

  const send = async () => {
    if (!active || !text.trim()) return;
    const body = { text: text.trim(), from: 'admin' };
    setText('');
    // notify stop typing
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try{ wsRef.current.send(JSON.stringify({ type: 'typing', chatId: active.id, typing: false, role: 'admin' })); }catch(e){}
    }
    const res = await fetch(`/api/chats/${active.id}/message`, { method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'include', body: JSON.stringify(body) });
    if (res.ok) {
      const messageData = await res.json();
      // Update local state and localStorage immediately
      if (messageData.message) {
        setActive(prev => prev ? { ...prev, messages: [...(prev.messages||[]), messageData.message] } : prev);
        // Save to localStorage
        try {
          const localChats = JSON.parse(localStorage.getItem('admin_chats') || '{}');
          if (localChats[active.id]) {
            localChats[active.id].messages = [...(localChats[active.id].messages || []), messageData.message];
            localStorage.setItem('admin_chats', JSON.stringify(localChats));
          }
        } catch (e) {}
      }
    }
    await loadList();
  };

  const sendTyping = (typing: boolean) => {
    if (!active || !wsRef.current) return;
    if (wsRef.current.readyState === WebSocket.OPEN) {
      try{ wsRef.current.send(JSON.stringify({ type: 'typing', chatId: active.id, typing, role: 'admin' })); }catch(e){}
    }
  };

  const handleInputChange = (val: string) => {
    setText(val);
    sendTyping(true);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => { sendTyping(false); typingTimer.current = null; }, 2000);
  };

  const assignToMe = async () => {
    if (!active) return;
    const res = await fetch(`/api/admin/chats/${active.id}/assign`, { method: 'POST', credentials: 'include' });
    if (res.ok) { const data = await res.json(); setActive(prev => prev ? { ...prev, assignedAdmin: data.assignedAdmin } : prev); await loadList(); }
  };

  const closeChat = async () => {
    if (!active) return;
    const res = await fetch(`/api/admin/chats/${active.id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ close: active.status === 'open' }) });
    if (res.ok) { const data = await res.json(); setActive(prev => prev ? { ...prev, status: data.status } : prev); await loadList(); }
  };

  const exportChat = async () => {
    if (!active) return;
    try{ window.open(`/api/admin/chats/${active.id}/export`, '_blank'); }catch(e){}
  };

  const deleteChat = async () => {
    if (!active) return;
    const confirmed = window.confirm(`Tem certeza que deseja DELETAR este chat? Essa ação é irreversível.`);
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/chats/${active.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast({ title: '✓ Chat deletado', description: 'Chat foi removido com sucesso' });
        setActive(null);
        await loadList();
      } else {
        toast({ title: '✗ Erro', description: 'Não foi possível deletar o chat' });
      }
    } catch (e) {
      toast({ title: '✗ Erro', description: 'Erro ao deletar chat' });
    }
  };

  const unassignChat = async () => {
    if (!active) return;
    try {
      const res = await fetch(`/api/admin/chats/${active.id}/unassign`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        toast({ title: '✓ Desatribuído', description: 'Chat foi desatribuído com sucesso' });
        setActive(prev => prev ? { ...prev, assignedAdmin: undefined } : prev);
        await loadList();
      }
    } catch (e) {
      toast({ title: '✗ Erro', description: 'Erro ao desatribuir chat' });
    }
  };

  const copyChatId = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.id);
      toast({ title: '✓ Copiado', description: 'ID do chat copiado para área de transferência' });
    } catch (e) {
      toast({ title: '✗ Erro', description: 'Erro ao copiar ID' });
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">Gerenciar Conversas</h2>
          <Badge variant="outline" className="text-sm">Total: {chats.length}</Badge>
        </div>
        
        {/* Search, Filter, Sort - melhorado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Procurar por nome, email ou ID..." 
                value={search} 
                onChange={(e)=>setSearch(e.target.value)} 
                className="pl-10 bg-muted/30" 
              />
            </div>
          </div>
          
          <select 
            value={filter} 
            onChange={(e)=>setFilter(e.target.value as any)} 
            className="px-3 py-2 border border-border rounded-md bg-background text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            <option value="all">Todas ({chats.length})</option>
            <option value="open">Abertas ({chats.filter(c => c.status === 'open').length})</option>
            <option value="closed">Fechadas ({chats.filter(c => c.status === 'closed').length})</option>
            <option value="assigned">Atribuídas ({chats.filter(c => c.assignedAdmin).length})</option>
            <option value="unread">Não Lidas ({chats.filter(c => c.unread).length})</option>
            <option value="anonymous">Anônimos ({chats.filter(c => c.name === 'Anônimo' || !c.email).length})</option>
            <option value="users">Usuários ({chats.filter(c => c.name !== 'Anônimo' && c.email).length})</option>
          </select>
          
          <select 
            value={sort} 
            onChange={(e)=>setSort(e.target.value as any)} 
            className="px-3 py-2 border border-border rounded-md bg-background text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            <option value="recent">Recentes</option>
            <option value="oldest">Antigas</option>
            <option value="urgent">Urgentes</option>
          </select>
        </div>
      </div>

      {/* Layout Principal - 2 colunas responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Painel de Conversas - Sidebar */}
        <div className="lg:col-span-1 flex flex-col border rounded-lg bg-muted/10 overflow-hidden">
          <div className="px-4 py-3 border-b bg-background/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold">Conversas ({filteredChats.length})</h3>
            <p className="text-xs text-muted-foreground mt-1">Clique para abrir</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {filteredChats.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                </div>
              </div>
            ) : (
              filteredChats.map(c => (
                <ChatListItem
                  key={c.id}
                  {...c}
                  isSelected={active?.id === c.id}
                  onClick={() => openChat(c.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Painel de Conversa - Detalhes */}
        <div className="lg:col-span-2 flex flex-col border rounded-lg bg-card overflow-hidden shadow-md">
          {active ? (
            <>
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                        {(active.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{active.name}</h3>
                        {active.email && (
                          <a href={`mailto:${active.email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {active.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={active.status === 'open' ? 'default' : 'secondary'} className="text-sm">
                    {active.status === 'open' ? '● Aberta' : '● Fechada'}
                  </Badge>
                </div>

                {/* Informações */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(active.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{active.messages?.length || 0} mensagens</span>
                  </div>
                  {active.assignedAdmin && (
                    <div className="col-span-2 md:col-span-2 font-semibold text-green-400">
                      ✓ Atende: {active.assignedAdmin}
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2 flex-wrap pt-2 border-t border-border/20">
                  {!active.assignedAdmin && (
                    <Button size="sm" onClick={assignToMe} className="gap-2">
                      <Check className="h-3.5 w-3.5" />
                      Atribuir a Mim
                    </Button>
                  )}
                  
                  {active.assignedAdmin && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={unassignChat} 
                      className="gap-2 text-yellow-600 border-yellow-600/30 hover:bg-yellow-600/10"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                      Desatribuir
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={closeChat}
                    className="gap-2"
                  >
                    {active.status === 'open' ? 'Fechar' : 'Reabrir'}
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={copyChatId}
                    className="gap-2"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar ID
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportChat}
                    className="gap-2"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={deleteChat}
                    className="gap-2 ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Deletar
                  </Button>
                </div>
              </div>

              {/* Mensagens */}
              <div ref={listRef} className="p-4 flex-1 overflow-y-auto space-y-3 bg-background/50">
                {(active.messages||[]).length === 0 && (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhuma mensagem ainda</p>
                    </div>
                  </div>
                )}
                
                {(active.messages||[]).map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      p-3 rounded-lg max-w-[70%] animate-fadeIn
                      ${m.from === 'admin' 
                        ? 'bg-primary/15 border border-primary/30 text-foreground' 
                        : 'bg-muted/50 border border-border/50'
                      }
                    `}>
                      <div className="flex items-center gap-2 mb-1">
                        {m.from === 'admin' && <Check className="h-3 w-3 text-primary" />}
                        <span className="text-xs font-semibold">
                          {m.author || (m.from === 'user' ? active.name : 'Você')}
                        </span>
                      </div>
                      <div className="text-sm break-words mb-1">{m.text}</div>
                      <div className="text-xs text-muted-foreground">{new Date(m.ts).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                
                {userTyping && (
                  <div className="flex justify-start">
                    <div className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"></span>
                      Usuário está digitando...
                    </div>
                  </div>
                )}
              </div>

              {/* Input de Resposta */}
              <div className="p-4 border-t bg-muted/20 space-y-2">
                {active.status === 'closed' && (
                  <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-600/10 px-3 py-2 rounded-md border border-yellow-600/30">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    Esta conversa está fechada. Reabra para responder.
                  </div>
                )}
                
                <div className="flex gap-2 items-end">
                  <textarea
                    value={text}
                    onChange={(e)=>handleInputChange(e.target.value)}
                    placeholder={active.status === 'closed' ? 'Chat fechado...' : 'Digite sua resposta...'}
                    onKeyDown={(e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    disabled={active.status === 'closed'}
                    className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm resize-none max-h-24 disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={2}
                  />
                  <Button 
                    onClick={send} 
                    disabled={!text.trim() || active.status === 'closed'}
                    className="gap-2 h-10"
                  >
                    <Check className="h-4 w-4" />
                    Enviar
                  </Button>
                </div>
                
                {adminCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    {adminCount} admin{adminCount > 1 ? 's' : ''} online
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Mail className="h-16 w-16 mx-auto opacity-20" />
                <p className="text-lg font-semibold">Selecione uma conversa</p>
                <p className="text-sm">Clique em uma conversa na lista para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default AdminChats;
