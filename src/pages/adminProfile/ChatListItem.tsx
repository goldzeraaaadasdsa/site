import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Clock, MessageSquare, AlertCircle, Lock } from 'lucide-react';

interface Message { from: 'user' | 'admin'; text: string; ts: string; author?: string }
interface ChatListItemProps {
  id: string;
  name: string;
  email?: string | null;
  createdAt: string;
  messages: Message[];
  status: string;
  assignedAdmin?: string;
  unread?: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  id,
  name,
  email,
  createdAt,
  messages,
  status,
  assignedAdmin,
  unread,
  isSelected,
  onClick,
}) => {
  const isAnonymous = name === 'Anônimo' || !email;
  const messageCount = messages?.length || 0;
  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageTime = lastMessage ? new Date(lastMessage.ts) : new Date(createdAt);
  
  // Calcular tempo desde última mensagem
  const now = new Date();
  const diffMs = now.getTime() - lastMessageTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  let timeStr = '';
  if (diffMins < 1) timeStr = 'agora';
  else if (diffMins < 60) timeStr = `${diffMins}m`;
  else if (diffHours < 24) timeStr = `${diffHours}h`;
  else timeStr = `${diffDays}d`;
  
  // Urgência: se não respondido há mais de 1 hora
  const isUrgent = diffHours >= 1 && unread;
  
  // Iniciais do avatar
  const avatarInitial = (name || 'A').charAt(0).toUpperCase();
  
  // Cor do avatar baseada no tipo
  const avatarBg = isAnonymous 
    ? 'bg-slate-500/30 text-slate-300' 
    : 'bg-blue-500/30 text-blue-300';

  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border-2 transition-all cursor-pointer overflow-hidden
        ${isSelected 
          ? 'bg-primary/10 border-primary/50 shadow-md' 
          : 'border-border/50 hover:bg-muted/30 hover:border-border'
        }
        ${status === 'closed' ? 'opacity-60' : ''}
        ${isUrgent ? 'ring-2 ring-red-500/50 ring-inset' : ''}
      `}
    >
      {/* Header com Avatar e Info Principal */}
      <div className="flex items-start gap-3 mb-2 min-w-0">
        {/* Avatar */}
        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarBg}`}>
          {avatarInitial}
        </div>
        
        {/* Informações Principais */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1 mb-1 min-w-0">
            <span className="font-semibold text-sm truncate">{name}</span>
            {status === 'closed' && (
              <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
        </div>
      </div>

      {/* Badges de Status */}
      <div className="flex gap-1 flex-wrap mb-2 min-w-0 overflow-hidden">
        {unread && (
          <Badge className={`text-xs whitespace-nowrap flex-shrink-0 ${isUrgent ? 'bg-red-600' : 'bg-orange-600'}`}>
            {isUrgent && <AlertCircle className="h-2.5 w-2.5 mr-1" />}
            {isUrgent ? 'Urgente' : 'Novo'}
          </Badge>
        )}
        
        {isAnonymous ? (
          <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">Anônimo</Badge>
        ) : (
          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/30 whitespace-nowrap flex-shrink-0">
            <User className="h-2.5 w-2.5 mr-1" />
            Usuário
          </Badge>
        )}
        
        {status === 'closed' && (
          <Badge variant="secondary" className="text-xs whitespace-nowrap flex-shrink-0">Fechada</Badge>
        )}
        
        {assignedAdmin && (
          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-300 border-green-500/30 whitespace-nowrap flex-shrink-0 max-w-full overflow-hidden text-ellipsis">
            ✓ {assignedAdmin}
          </Badge>
        )}
      </div>

      {/* Info de Mensagens e Tempo */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2 flex-shrink-0">
        <div className="flex items-center gap-1 flex-shrink-0">
          <MessageSquare className="h-3 w-3 flex-shrink-0" />
          <span className="whitespace-nowrap">{messageCount} msg</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span className="whitespace-nowrap">{timeStr}</span>
        </div>
      </div>

      {/* Preview da última mensagem */}
      {lastMessage && (
        <div className="pt-2 border-t border-border/30 min-w-0 overflow-hidden">
          <p className="text-xs text-muted-foreground line-clamp-2 break-words">
            <span className="font-semibold">{lastMessage.from === 'admin' ? 'Você: ' : ''}</span>
            {lastMessage.text}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatListItem;
