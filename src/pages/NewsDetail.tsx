import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Calendar, User, Tag, Share2, Heart, Eye, Clock, 
  ChevronRight, MessageCircle, Bookmark, ChevronUp, ThumbsUp 
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  date: string;
  category: string;
  image?: string;
  author?: string;
  content?: string;
  views?: number;
}

interface NewsDetail extends NewsItem {
  content: string;
}

const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [views, setViews] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Fetch all news
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        setAllNews(data);
        // Find current news
        const foundNews = data.find((n: NewsItem) => n.id === Number(id));
        if (foundNews) {
          setNews({
            ...foundNews,
            content: foundNews.content || `${foundNews.summary}\n\nConteúdo detalhado sobre ${foundNews.title}. Esta notícia traz informações importantes para a comunidade de sim racing.`
          });
          setViews((foundNews.views || 0) + 1);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch news:', err);
        setLoading(false);
      });
  }, [id]);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Posts relacionados
  const relatedPosts = useMemo(() => {
    if (!news) return [];
    return allNews
      .filter(n => n.id !== Number(id) && n.category === news.category)
      .slice(0, 3);
  }, [allNews, news, id]);

  // Posts recomendados
  const recommendedPosts = useMemo(() => {
    if (!news) return [];
    return allNews
      .filter(n => n.id !== Number(id))
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [allNews, news, id]);

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: news?.title,
        text: `Confira: ${news?.title}`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-12 w-32 mb-6" />
          <Skeleton className="h-64 w-full mb-6 rounded-lg" />
          <Skeleton className="h-8 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">📰</div>
            <h1 className="text-3xl font-bold mb-2">Notícia não encontrada</h1>
            <p className="text-muted-foreground mb-6">A notícia que você procura não existe ou foi removida.</p>
            <Button onClick={() => navigate('/news')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Notícias
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary z-50" style={{ width: `${scrollProgress}%` }} />

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <Header />
      <main className="container py-8 relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/news')}
          className="mb-6 animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Notícias
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {/* Article Card */}
            <Card className="glass-card overflow-hidden">
              {/* Feature Image */}
              <div className="relative aspect-video overflow-hidden bg-muted">
                {news.image && (
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Category Badge */}
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-primary text-primary-foreground">
                    <Tag className="h-3 w-3 mr-1" />
                    {news.category}
                  </Badge>
                </div>

                {/* Views Count */}
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {views} visualizações
                </div>
              </div>

              <CardContent className="p-8">
                {/* Header */}
                <div className="mb-6">
                  {/* Title */}
                  <h1 className="text-4xl font-bold mb-4 leading-tight">
                    {news.title}
                  </h1>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(news.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      ~{Math.ceil((news.content?.split(' ').length || 100) / 200)} min de leitura
                    </div>
                  </div>

                  {/* Summary/Subtitle */}
                  <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">
                    {news.summary}
                  </p>
                </div>

                <Separator className="my-8" />

                {/* Content */}
                <div className="prose prose-invert max-w-none mb-8">
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    {news.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-base">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 py-4">
                  <Button
                    variant={liked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className="gap-2"
                  >
                    <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                    {liked ? 'Curtido' : 'Curtir'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>

                  <Button variant="outline" size="sm" className="gap-2">
                    <Bookmark className="h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <Card className="glass-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChevronRight className="h-5 w-5" />
                    Leia Também
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedPosts.map(post => (
                    <RouterLink
                      key={post.id}
                      to={`/news/${post.id}`}
                      className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-primary/30"
                    >
                      <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.date).toLocaleDateString('pt-BR')}
                      </p>
                    </RouterLink>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            {/* Author Card */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${news.author}`} />
                    <AvatarFallback>{news.author?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{news.author || 'BSR Admin'}</h3>
                    <p className="text-xs text-muted-foreground">Autor</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Profissional de sim racing com experiência em conteúdo e jornalismo.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <MessageCircle className="h-3 w-3 mr-2" />
                  Seguir
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Visualizações
                  </div>
                  <div className="text-2xl font-bold text-primary">{views}</div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    Curtidas
                  </div>
                  <div className="text-2xl font-bold text-primary">{liked ? '1' : '0'}</div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Leitura
                  </div>
                  <div className="text-sm font-medium">{Math.ceil((news.content?.split(' ').length || 100) / 200)} min</div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Posts */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Em Tendência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendedPosts.map((post, idx) => (
                  <RouterLink
                    key={post.id}
                    to={`/news/${post.id}`}
                    className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-sm font-bold text-primary w-6 flex-shrink-0">#{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(post.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </RouterLink>
                ))}
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="glass-card border-primary/50 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">📧 Newsletter</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Receba as melhores notícias direto no seu e-mail
                </p>
                <Button size="sm" className="w-full">
                  Inscrever
                </Button>
              </CardContent>
            </Card>

            {/* Back to Top */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ChevronUp className="h-4 w-4 mr-2" />
              Voltar ao Topo
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewsDetailPage;