import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUser, useAdmin, useFetch } from "@/hooks/useUserData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-racing.jpg";
import ProfileOverview from './ProfileOverview';
import ProfileRaces from './ProfileRaces';
import ProfileStats from './ProfileStats';
import ProfileAchievements from './ProfileAchievements';
import AdminProfile from '@/pages/adminProfile';
import { User, Race, NewsItem, RaceData, Standing, Achievement, AdminStats, Account } from "@/types";

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { user: profileUser, loading: profileLoading } = useUser();
  const { isAdmin } = useAdmin();
  const { data: myRaces = [] } = useFetch<Race[]>('/api/my/races', !!authUser);
  const { data: adminNews = [] } = useFetch<NewsItem[]>('/api/news', isAdmin);
  const { data: adminRaces = [] } = useFetch<RaceData[]>('/api/races', isAdmin);
  const { data: adminStandings = [] } = useFetch<Standing[]>('/api/standings', isAdmin);
  const { data: adminAchievements = [] } = useFetch<Achievement[]>('/api/achievements', isAdmin);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (profileUser) {
      setUser(profileUser);
    }
  }, [profileUser]);

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !authUser) {
      navigate('/login');
      return;
    }
  }, [authUser, authLoading, navigate]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Carregando...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!authUser) {
    return null; // Will redirect to login
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative min-h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="container relative flex min-h-[60vh] items-center pt-16">
          <div className="flex items-center gap-8">
            <div className="h-32 w-32 border-4 border-primary/50 animate-fade-in rounded-full overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
              {user.steam?.avatar ? (
                <img
                  src={user.steam.avatar}
                  alt={user.displayName || user.username}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="h-full w-full bg-primary/10 flex items-center justify-center text-2xl" style={{ display: user.steam?.avatar ? 'none' : 'flex' }}>
                <div className="h-16 w-16 rounded-full bg-primary/20" />
              </div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h1 className="font-heading text-4xl font-black text-foreground md:text-5xl">
                Bem-vindo, <span className="text-primary">{user.displayName || user.username}</span>
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Piloto da comunidade Brasil Sim Racing
              </p>
              <div className="mt-4">
                <div className="inline-block bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-2">
                  Temporada 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <main className="container py-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} mb-8`}>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="races">Minhas Corridas</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="admin" 
                className="admin-panel-trigger relative overflow-hidden font-semibold"
              >
                <span className="relative z-10">Painel Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <ProfileOverview user={user} />
          </TabsContent>

          <TabsContent value="races" className="space-y-6">
            <ProfileRaces myRaces={myRaces} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            <ProfileStats user={user} myRaces={myRaces} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <ProfileAchievements user={user} myRaces={myRaces} achievements={achievements} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <AdminProfile />
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-center mt-12">
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </Button>
        </div>
      </main>

      <style>{`
        .admin-panel-trigger {
          background: linear-gradient(135deg, #002776 0%, #FFD700 50%, #009639 100%);
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: 2px solid transparent;
          background-clip: padding-box;
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 39, 118, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .admin-panel-trigger:hover {
          box-shadow: 0 6px 20px rgba(0, 39, 118, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .admin-panel-trigger[data-state="active"] {
          background: linear-gradient(135deg, #002776 0%, #FFD700 50%, #009639 100%);
          color: white;
          box-shadow: 0 6px 25px rgba(0, 39, 118, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 215, 0, 0.3);
        }

        .admin-panel-trigger::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default Profile;