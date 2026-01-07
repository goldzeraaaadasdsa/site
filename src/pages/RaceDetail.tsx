import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Calendar, MapPin, Users, Trophy, Share, Thermometer, Wind, Droplet, 
  Gauge, Flag, Clock, Car, Timer, ChevronDown, ChevronUp, Server, BarChart2, 
  Settings, Target, Play, Pause, FastForward, Rewind, Download, Eye, EyeOff, 
  Volume2, VolumeX, Maximize, Minimize, GitCompare, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle2, XCircle, Info, HelpCircle, LayoutGrid, LayoutList, 
  SlidersHorizontal, Award, Medal, Star, Heart, MessageCircle, Bookmark, 
  MoreHorizontal, ChevronRight, ChevronLeft, RefreshCw, AlertTriangle, Zap
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface EnrichedParticipant {
  username: string;
  displayName: string;
  avatar: string | null;
  stats: { wins: number; podiums: number; points: number };
  team: string;
  achievements: any[];
  registeredAt: string;
}

interface Race {
  id: number;
  title: string;
  track: string;
  date: string;
  time: string;
  description: string;
  image: string;
  laps: string;
  duration: string;
  pilots: number;
  participants: EnrichedParticipant[];
  championship?: string;
  trackTemp?: string;
  airTemp?: string;
  windSpeed?: string;
  windDirection?: string;
  fuelRecommendation?: string;
  status?: string;
  serverIp?: string;
  serverPort?: string;
  maxParticipants?: string;
  category?: string;
  prize?: string;
  requirement?: string;
  createdAt?: string;
  udpListenAddress?: string;
  udpSendAddress?: string;
  udpEnabled?: boolean;
  udpRefreshInterval?: number;
}

const RaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estado da corrida
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Estado de UI
  const [activeTab, setActiveTab] = useState("pilotos");
  const [fullscreen, setFullscreen] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Refs
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const timingTableRef = useRef<HTMLDivElement>(null);

  // Carregar dados da corrida enriquecida
  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/races/${id}/enriched`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setRace(data);
        } else {
          setRace(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar corrida:', err);
        setLoading(false);
      });
  }, [id]);

  // Verificar se é um usuário registrado
  useEffect(() => {
    if (race) {
      fetch('/api/session')
        .then(res => res.json())
        .then(session => {
          if (session.user) {
            setIsRegistered(race.participants.some(p => p.username === session.user.username));
          }
        })
        .catch(err => console.error('Erro ao verificar sessão:', err));
    }
  }, [race]);

  const getStatusColor = (status?: string) => {
    if (status === 'live') return 'bg-red-500 animate-pulse';
    if (status === 'completed') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const handleRegister = async () => {
    if (!race) return;
    setRegistering(true);
    try {
      const response = await fetch(`/api/races/${race.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setIsRegistered(true);
        // Recarregar dados
        fetch(`/api/races/${race.id}/enriched`)
          .then(res => res.json())
          .then(data => setRace(data));
      } else {
        alert(result.message || 'Erro ao se inscrever');
      }
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      alert('Erro ao se inscrever');
    }
    setRegistering(false);
  };

  const toggleFullscreen = () => {
    const element = mainContainerRef.current;
    if (!element) return;

    if (!fullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.error('Erro ao ativar fullscreen:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setFullscreen(!fullscreen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Corrida não encontrada</h1>
            <Button onClick={() => navigate('/races')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para corridas
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate('/races')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para corridas
        </Button>

        {/* Cabeçalho da Corrida */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold mb-3">{race.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{race.track}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{new Date(race.date).toLocaleDateString('pt-BR')} às {race.time}</span>
                </div>
                <Badge className={getStatusColor(race.status)}>
                  {race.status === 'live' ? '🔴 AO VIVO' : race.status === 'completed' ? '✓ Finalizado' : '⏱ Próxima'}
                </Badge>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleRegister}
              disabled={isRegistered || registering}
              className="flex-shrink-0"
            >
              {isRegistered ? '✓ Inscrito' : registering ? 'Inscrevendo...' : '🏁 Inscrever-se'}
            </Button>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid lg:grid-cols-4 gap-8" ref={mainContainerRef}>
          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            <Card className="glass-card gradient-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Pilotos Inscritos ({race.participants.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex border rounded-lg p-1 bg-muted/50">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      <LayoutList className="h-4 w-4" />
                    </button>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                        {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fullscreen</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                {race.participants && race.participants.length > 0 ? (
                  <>
                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg mb-6 border border-primary/20">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-semibold">Pilotos Inscritos</div>
                        <div className="text-2xl font-bold text-primary">{race.participants.length}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-semibold">Voltas</div>
                        <div className="text-2xl font-bold text-secondary">{race.laps}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-semibold">Duração</div>
                        <div className="text-2xl font-bold text-accent">{race.duration}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-semibold">Categoria</div>
                        <div className="text-lg font-bold truncate">{race.category || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Vista em Grid */}
                    {viewMode === 'grid' && (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {race.participants.map((participant, idx) => (
                          <div
                            key={participant.username}
                            className="p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/50 transition-all duration-200 group"
                          >
                            {/* Posição */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                  idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-blue-500'
                                }`}>
                                  {idx + 1}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {new Date(participant.registeredAt).toLocaleDateString('pt-BR')}
                              </Badge>
                            </div>

                            {/* Avatar e Nome */}
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarImage src={participant.avatar || undefined} alt={participant.displayName} />
                                <AvatarFallback>{participant.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate text-sm">{participant.displayName}</h4>
                                <p className="text-xs text-muted-foreground truncate">{participant.team}</p>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-3 bg-muted/30 p-2 rounded">
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="text-center text-xs">
                                    <Trophy className="h-3 w-3 mx-auto mb-1 text-yellow-500" />
                                    <div className="font-bold">{participant.stats.wins}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Vitórias</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="text-center text-xs">
                                    <Medal className="h-3 w-3 mx-auto mb-1 text-green-500" />
                                    <div className="font-bold">{participant.stats.podiums}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Pódios</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="text-center text-xs">
                                    <Zap className="h-3 w-3 mx-auto mb-1 text-orange-500" />
                                    <div className="font-bold">{participant.stats.points}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Pontos</TooltipContent>
                              </Tooltip>
                            </div>

                            {/* Achievements */}
                            {participant.achievements && participant.achievements.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {participant.achievements.slice(0, 3).map((ach, i) => (
                                  <Tooltip key={i}>
                                    <TooltipTrigger>
                                      <Award className="h-4 w-4 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>{ach.name || 'Conquista'}</TooltipContent>
                                  </Tooltip>
                                ))}
                                {participant.achievements.length > 3 && (
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    +{participant.achievements.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vista em Lista */}
                    {viewMode === 'list' && (
                      <div className="overflow-x-auto rounded-lg border" ref={timingTableRef}>
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="p-3 text-left">Pos</th>
                              <th className="p-3 text-left">Piloto</th>
                              <th className="p-3 text-center">V</th>
                              <th className="p-3 text-center">P</th>
                              <th className="p-3 text-center">Pts</th>
                              <th className="p-3 text-left">Equipe</th>
                              <th className="p-3 text-left">Inscrição</th>
                            </tr>
                          </thead>
                          <tbody>
                            {race.participants.map((participant, idx) => (
                              <tr
                                key={participant.username}
                                className="border-b hover:bg-muted/20 transition-colors"
                              >
                                <td className="p-3 font-bold">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-blue-500'
                                  }`}>
                                    {idx + 1}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={participant.avatar || undefined} />
                                      <AvatarFallback>{participant.displayName.substring(0, 1)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{participant.displayName}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center font-semibold text-yellow-500">{participant.stats.wins}</td>
                                <td className="p-3 text-center font-semibold text-green-500">{participant.stats.podiums}</td>
                                <td className="p-3 text-center font-semibold text-orange-500">{participant.stats.points}</td>
                                <td className="p-3 text-muted-foreground">{participant.team}</td>
                                <td className="p-3 text-muted-foreground text-xs">
                                  {new Date(participant.registeredAt).toLocaleDateString('pt-BR')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">Nenhum piloto inscrito ainda</p>
                    <p className="text-sm">Seja o primeiro a se inscrever!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel Lateral */}
          <div className="lg:col-span-1 space-y-4">
            {/* Informações da Corrida */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Detalhes da Corrida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Pista</div>
                  <div className="font-semibold text-sm">{race.track}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Categoria</div>
                  <div className="font-semibold text-sm">{race.category || 'N/A'}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Voltas</div>
                  <div className="font-semibold text-sm">{race.laps}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Duração</div>
                  <div className="font-semibold text-sm">{race.duration}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Inscritos</div>
                  <Progress value={(race.participants.length / Number(race.maxParticipants || 20)) * 100} className="h-2 mb-1" />
                  <div className="font-semibold text-sm">{race.participants.length}/{race.maxParticipants || 20}</div>
                </div>
              </CardContent>
            </Card>

            {/* Condições Climáticas */}
            {race.trackTemp && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Clima</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Pista</div>
                      <div className="font-bold">{race.trackTemp}°C</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                    <Thermometer className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Ar</div>
                      <div className="font-bold">{race.airTemp}°C</div>
                    </div>
                  </div>
                  {race.windSpeed && (
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                      <Wind className="h-5 w-5 text-teal-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">Vento</div>
                        <div className="font-bold">{race.windSpeed} km/h</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Descrição */}
            {race.description && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Informações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{race.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Requisitos */}
            {race.requirement && (
              <Card className="glass-card border-yellow-500/30 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Requisitos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{race.requirement}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RaceDetail;
