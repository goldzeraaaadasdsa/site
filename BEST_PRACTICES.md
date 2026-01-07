# 🎯 Guia de Melhores Práticas - Brasil Sim Racing

## 1. Usando os Novos Hooks

### ✅ Forma Correta
```typescript
import { useUser, useAdmin, useFetch } from '@/hooks/useUserData';

export const MyComponent = () => {
  // Fetch current user
  const { user, loading, error } = useUser();

  // Check admin status
  const { isAdmin } = useAdmin();

  // Fetch generic data
  const { data: races, loading: racesLoading } = useFetch<Race[]>('/api/races');

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return <div>{user?.displayName}</div>;
};
```

### ❌ Evitar
```typescript
const [user, setUser] = useState(null);
useEffect(() => {
  fetch('/api/session')
    .then(r => r.json())
    .then(setUser)
    .catch(console.error);
}, []);
```

---

## 2. Validando Dados com Zod

### ✅ Forma Correta
```typescript
import { RaceSchema, safeValidate } from '@/lib/validation';

// No backend (server.js)
app.post('/api/races', requireAdmin, (req, res) => {
  const { success, data, error } = safeValidate(RaceSchema, req.body);
  
  if (!success) {
    return res.status(400).json({ ok: false, message: error });
  }

  // data is type-safe Race!
  const newRace = data;
  // ...
});

// No frontend (React)
const handleCreateRace = async (formData: unknown) => {
  const { success, data, error } = safeValidate(RaceSchema, formData);
  
  if (!success) {
    toast({ variant: 'destructive', description: error });
    return;
  }

  await apiPost('/api/races', data);
};
```

### ❌ Evitar
```typescript
// Sem validação - qualquer coisa passa
const race = req.body;
saveRace(race);

// No frontend - type casting inseguro
const race = req.body as Race; // Assume está correto
```

---

## 3. Tipos Centralizados

### ✅ Forma Correta
```typescript
import { User, Race, NewsItem, Achievement } from '@/types';

// Todos os arquivos usam o mesmo tipo
interface Props {
  user: User;
  races: Race[];
  news: NewsItem[];
}

// Type-safe throughout codebase
const getUserName = (user: User): string => user.displayName || user.username;
```

### ❌ Evitar
```typescript
// Cada arquivo define seu próprio User type
interface User { username: string; ... } // em AuthContext.tsx
interface User { displayName?: string; ... } // em Profile.tsx
interface User { stats?: Stats; ... } // em AdminProfile.tsx

// Incompatível! Causa bugs
```

---

## 4. Tratamento de Erros

### ✅ Forma Correta
```typescript
import { formatError } from '@/server/utils';

// No backend
app.get('/api/races', (req, res) => {
  try {
    const races = readRaces();
    res.json(races);
  } catch (err) {
    // Automatically sanitizes errors
    res.status(500).json(formatError(err, isDev));
  }
});

// No frontend com toast
const { data, error } = useFetch('/api/races');

if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Erro ao carregar corridas</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
```

### ❌ Evitar
```typescript
// Expõe stack trace em produção
catch (err) {
  res.json({ error: err.stack }); // NUNCA!
}

// Erro silencioso
try {
  const data = await fetch('/api/races');
} catch (err) {
  console.error(err); // Usuário não sabe que deu erro
}
```

---

## 5. Proteção de Endpoints Admin

### ✅ Forma Correta
```typescript
// Sempre use requireAdmin para endpoints sensíveis
app.post('/api/races', requireAdmin, (req, res) => { ... });
app.put('/api/races/:id', requireAdmin, (req, res) => { ... });
app.delete('/api/races/:id', requireAdmin, (req, res) => { ... });

// Com validação
app.post('/api/races', requireAdmin, (req, res) => {
  const { success, data } = safeValidate(RaceSchema, req.body);
  if (!success) return res.status(400).json({ ok: false });
  // ...
});
```

### ❌ Evitar
```typescript
// SEM proteção - qualquer um pode criar/deletar
app.post('/api/races', (req, res) => { ... });
app.delete('/api/races/:id', (req, res) => { ... });

// Sem validação - dados inválidos salvam
app.post('/api/races', requireAdmin, (req, res) => {
  saveRace(req.body); // Pode ter campos inválidos
});
```

---

## 6. Estrutura de Componentes

### ✅ Forma Correta
```typescript
import { useUser, useFetch } from '@/hooks/useUserData';
import { User, Race } from '@/types';
import { Card } from '@/components/ui/card';

interface Props {
  userId?: string;
}

export const ProfileCard: React.FC<Props> = ({ userId }) => {
  const { user, loading, error } = useUser();
  const { data: races } = useFetch<Race[]>('/api/my/races');

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} />;
  if (!user) return null;

  return (
    <Card>
      <h2>{user.displayName || user.username}</h2>
      <p>Corridas: {races?.length || 0}</p>
    </Card>
  );
};
```

### ❌ Evitar
```typescript
// Múltiplas responsabilidades
export const ProfileCard = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/' + userId)
      .then(r => r.json())
      .then(setUser)
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
    
    fetch('/api/my/races')
      .then(r => r.json())
      .then(setRaces)
      .catch(err => console.log(err));
  }, [userId]);

  // ... 50 linhas do rendering
};
```

---

## 7. API Calls Seguras

### ✅ Forma Correta
```typescript
import { apiGet, apiPost } from '@/lib/api';
import { RaceSchema, safeValidate } from '@/lib/validation';

// GET com tipo seguro
const races = await apiGet<Race[]>('/api/races');

// POST com validação
const formData = { title: 'F1', track: 'Monaco' };
const { success, data } = safeValidate(RaceSchema, formData);

if (success) {
  const newRace = await apiPost<Race>('/api/races', data);
}
```

### ❌ Evitar
```typescript
// Raw fetch sem type-safety
const races = await fetch('/api/races').then(r => r.json());

// Casting inseguro
const race = (await fetch('/api/races').then(r => r.json())) as Race;

// Sem tratamento de erro
const data = JSON.parse(response);
```

---

## 8. Validação de Environment Variables

### ✅ Forma Correta
```bash
# .env
NODE_ENV=development
SESSION_SECRET=your-super-secret-key-min-32-chars
STEAM_API_KEY=your-steam-api-key
FRONTEND_URL=http://localhost:8080

# Servidor valida no startup
# Se faltar var obrigatória, erro claro:
# ❌ Missing environment variables: STEAM_API_KEY
```

### ❌ Evitar
```javascript
// Sem validação - server inicia mesmo sem vars críticas
const apiKey = process.env.STEAM_API_KEY; // undefined
apiCall(apiKey); // Erro lá na primeira requisição Steam
```

---

## 9. Padrão de Data Fetching em Componentes

### ✅ Forma Correta - Profile Component
```typescript
export const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { user: profileUser, loading: profileLoading } = useUser();
  const { isAdmin } = useAdmin();
  const { data: myRaces } = useFetch<Race[]>('/api/my/races', !!user);

  const loading = authLoading || profileLoading;

  if (loading) return <Loading />;

  return (
    <Tabs>
      <TabsContent value="races">
        <RacesList races={myRaces} />
      </TabsContent>
    </Tabs>
  );
};
```

---

## 10. Logging (Recomendado para Futuro)

### ✅ Forma Recomendada (Soon)
```typescript
// server.js
import logger from 'winston';

// Em vez de console.log
console.error('Error:', error); 
// Usar:
logger.error('Race creation failed', { userId, error: error.message });

// Permite:
// - Logs estruturados em JSON
// - Filtros por nível (error, warn, info)
// - Saída para arquivo + console
// - Request ID tracking
```

---

## ✅ Checklist para Novo Endpoint

Quando criar novo endpoint, verificar:

- [ ] POST/PUT/DELETE tem `requireAdmin`?
- [ ] Input validado com Zod schema?
- [ ] Erro tratado com `formatError()`?
- [ ] Response tipo correto?
- [ ] Rate limit apropriado?
- [ ] Documentação em README.md?
- [ ] Testado manualmente?

**Exemplo**:
```typescript
// POST /api/races
app.post('/api/races', requireAdmin, (req, res) => {
  try {
    const { success, data, error } = safeValidate(RaceSchema, req.body);
    if (!success) return res.status(400).json({ ok: false, message: error });

    const newRace = { ...data, id: getNextId() };
    saveRace(newRace);

    res.json({ ok: true, race: newRace });
  } catch (err) {
    res.status(500).json(formatError(err, isDev));
  }
});
```

---

## 🎓 Recursos Úteis

- **Types**: `/src/types/index.ts`
- **Validation Schemas**: `/src/lib/validation.ts`
- **Hooks**: `/src/hooks/useUserData.ts`
- **API Utils**: `/src/lib/api.ts`
- **Server Utils**: `/server/utils.js`
- **README**: `/README.md`

---

**Seguindo essas práticas, o código será mais seguro, testável e mantível!** ✅
