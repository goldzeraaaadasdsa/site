import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Trophy, 
  Flag, 
  Newspaper, 
  BarChart3,
  Home,
  Settings,
  MessageCircle
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'overview', label: 'Visão Geral', icon: Home },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'achievements', label: 'Conquistas', icon: Trophy },
    { id: 'races', label: 'Corridas', icon: Flag },
    { id: 'news', label: 'Notícias', icon: Newspaper },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'standings', label: 'Classificações', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <Card className="sticky top-8 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg truncate">Navegação Admin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'default' : 'ghost'}
            className={`w-full justify-start min-w-0 ${activeTab === item.id ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground'}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
          >
            <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminSidebar;