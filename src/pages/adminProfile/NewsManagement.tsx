import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Newspaper, Search, Filter, SortAsc, SortDesc, Calendar, Eye, User, FileText, X } from 'lucide-react';
import { News } from './types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import EditDialog from './EditDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface NewsManagementProps {
  news: News[];
  setNews: React.Dispatch<React.SetStateAction<News[]>>;
  isLoading: boolean;
}

const NewsManagement: React.FC<NewsManagementProps> = ({ news, setNews, isLoading }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editItem, setEditItem] = useState<News | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });
  const [activeTab, setActiveTab] = useState<string>('grid');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [newsToDelete, setNewsToDelete] = useState<News | null>(null);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(news.map(n => n.category).filter(Boolean))];
    return ['all', ...uniqueCategories];
  }, [news]);

  // Filtered and sorted news
  const filteredNews = useMemo(() => {
    let result = [...news];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.summary?.toLowerCase().includes(searchLower) ||
        item.content?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.author?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(item => {
        if (filterStatus === 'published') return item.published;
        if (filterStatus === 'draft') return !item.published;
        return true;
      });
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter(item => item.category === filterCategory);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc'
          ? new Date(a.date || '').getTime() - new Date(b.date || '').getTime()
          : new Date(b.date || '').getTime() - new Date(a.date || '').getTime();
      } else if (sortConfig.key === 'title') {
        return sortConfig.direction === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortConfig.key === 'views') {
        return sortConfig.direction === 'asc'
          ? (a.views || 0) - (b.views || 0)
          : (b.views || 0) - (a.views || 0);
      }
      return 0;
    });

    return result;
  }, [news, searchTerm, filterStatus, filterCategory, sortConfig]);

  // Statistics
  const stats = useMemo(() => {
    const total = news.length;
    const published = news.filter(n => n.published).length;
    const drafts = news.filter(n => !n.published).length;
    const totalViews = news.reduce((sum, n) => sum + (n.views || 0), 0);
    
    return { total, published, drafts, totalViews };
  }, [news]);

  const handleEdit = useCallback((newsItem: News) => {
    setEditItem(newsItem);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((newsId: string) => {
    const newsItem = news.find(n => n.id === newsId);
    if (newsItem) {
      setNewsToDelete(newsItem);
      setDeleteConfirmOpen(true);
    }
  }, [news]);

  const confirmDelete = useCallback(async () => {
    if (newsToDelete) {
      try {
        // Call the API to delete the news from the server
        const response = await fetch(`/api/news/${newsToDelete.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Update local state after successful deletion
        setNews(prev => prev.filter(item => item.id !== newsToDelete.id));
        toast({
          title: "Sucesso",
          description: `Notícia "${newsToDelete.title}" excluída com sucesso.`,
        });
        setDeleteConfirmOpen(false);
      } catch (error) {
        console.error(`Error deleting news:`, error);
        toast({
          title: "Erro",
          description: `Falha ao excluir notícia. Por favor, tente novamente.`,
          variant: "destructive",
        });
      }
    }
  }, [newsToDelete, setNews, toast]);

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
    try {
      // Get current user's display name or username as author
      const authorName = user?.displayName || user?.username || 'Admin';
      
      const savedItem = {
        ...data,
        id: data.id || `news-${Date.now()}`,
        author: authorName,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as News;
       
      // Call the appropriate API endpoint
      let response;
      if (data.id) {
        // Update existing news
        response = await fetch(`/api/news/${data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedItem),
          credentials: 'include'
        });
      } else {
        // Create new news
        response = await fetch('/api/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedItem),
          credentials: 'include'
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update local state
      setNews(prev => data.id
        ? prev.map(item => item.id === data.id ? result.item : item)
        : [result.item, ...prev]
      );
      
      setIsDialogOpen(false);
      setEditItem(null);
      
      toast({
        title: "Sucesso",
        description: `Notícia ${data.id ? 'atualizada' : 'criada'} com sucesso.`,
      });
    } catch (error) {
      console.error(`Error saving news:`, error);
      toast({
        title: "Erro",
        description: `Falha ao salvar notícia. Por favor, tente novamente.`,
        variant: "destructive",
      });
    }
  }, [setNews, toast, user]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusBadge = (published: boolean) => {
    return published
      ? <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80">✅ Publicado</Badge>
      : <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80">📝 Rascunho</Badge>;
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'racing': 'bg-red-100 text-red-800 border-red-200',
      'technology': 'bg-blue-100 text-blue-800 border-blue-200',
      'community': 'bg-green-100 text-green-800 border-green-200',
      'updates': 'bg-purple-100 text-purple-800 border-purple-200',
      'announcement': 'bg-orange-100 text-orange-800 border-orange-200',
      'tutorial': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderNewsCard = (newsItem: News) => (
    <Card
      key={newsItem.id}
      className="relative group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden h-full flex flex-col"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-primary/10 border-2 border-primary/20 shadow-md">
              <Newspaper className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3 flex-wrap">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{newsItem.title}</CardTitle>
              {getStatusBadge(newsItem.published)}
            </div>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
              {newsItem.summary || newsItem.content?.substring(0, 100)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col">
        <div className="space-y-4">
          {/* Category and Tags */}
          <div className="flex flex-wrap gap-2">
            {newsItem.category && (
              <Badge className={`text-xs px-2 py-1 ${getCategoryColor(newsItem.category)}`}>
                {newsItem.category}
              </Badge>
            )}
            {newsItem.tags && newsItem.tags.slice(0, 2).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-primary/5 text-primary border-primary/10">
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground/80">VISUALIZAÇÕES</div>
                <div className="font-semibold text-gray-900 dark:text-white">{newsItem.views || 0}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground/80">AUTOR</div>
                <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{newsItem.author || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(newsItem.date || newsItem.createdAt || '').toLocaleDateString('pt-BR')}</span>
          </div>

          {/* Image preview */}
          {newsItem.image && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
              <img src={newsItem.image} alt={newsItem.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-6 mt-auto border-t border-gray-200 dark:border-gray-700 flex space-x-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 border-primary text-primary hover:bg-primary/5"
            onClick={() => handleEdit(newsItem)}
          >
            <Edit className="h-4 w-4 mr-2" />
            <span className="font-medium">Editar</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 h-10"
            onClick={() => handleDelete(newsItem.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="font-medium">Excluir</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('title')}>
              <div className="flex items-center space-x-1">
                <span>Título</span>
                {sortConfig.key === 'title' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </div>
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground">Categoria</th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground">Autor</th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('date')}>
              <div className="flex items-center space-x-1">
                <span>Data</span>
                {sortConfig.key === 'date' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </div>
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('views')}>
              <div className="flex items-center space-x-1">
                <span>Visualizações</span>
                {sortConfig.key === 'views' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </div>
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground">Status</th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredNews.map(item => (
            <tr key={item.id} className="hover:bg-muted/50 transition-colors">
              <td className="p-3 text-sm font-medium text-gray-900 dark:text-white max-w-xs line-clamp-1">{item.title}</td>
              <td className="p-3 text-sm text-muted-foreground">{item.category || '-'}</td>
              <td className="p-3 text-sm text-muted-foreground">{item.author || '-'}</td>
              <td className="p-3 text-sm text-muted-foreground">{new Date(item.date || item.createdAt || '').toLocaleDateString('pt-BR')}</td>
              <td className="p-3 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span className="font-semibold">{item.views || 0}</span>
                </div>
              </td>
              <td className="p-3 text-sm">{getStatusBadge(item.published)}</td>
              <td className="p-3 text-sm space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Gerenciamento de Notícias</h2>
          <Button 
            onClick={() => {
              setEditItem({
                id: '',
                title: '',
                content: '',
                summary: '',
                image: '',
                category: '',
                published: false,
                views: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Notícia
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total de Notícias</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.published}</div>
                <div className="text-sm text-muted-foreground">Publicadas</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.drafts}</div>
                <div className="text-sm text-muted-foreground">Rascunhos</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalViews}</div>
                <div className="text-sm text-muted-foreground">Total de Visualizações</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Procurar por título, autor, categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/30"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="published">Publicados ({stats.published})</SelectItem>
                <SelectItem value="draft">Rascunhos ({stats.drafts})</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'Todas as Categorias' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabs for Grid/Table View */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="grid">Grade</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg">Nenhuma notícia encontrada</p>
                </div>
              </div>
            ) : (
              filteredNews.map(renderNewsCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          {filteredNews.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg">Nenhuma notícia encontrada</p>
              </div>
            </div>
          ) : (
            renderTableView()
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Notícia</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar "{newsToDelete?.title}"? Essa ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditDialog
        item={editItem}
        type="news"
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        isLoading={isLoading}
      />
    </div>
  );
};

export default NewsManagement;