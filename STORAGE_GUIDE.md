# 📦 Guia de Uso - Storage Utility

Utilitário simples para persistir dados no navegador usando localStorage.

## 🚀 Importação

```typescript
import Storage from './utils/storage';
// ou
import { Storage, useLocalStorage } from './utils/storage';
```

## 📝 Exemplos de Uso

### 1. Salvar Dados

```typescript
// Salvar um objeto
Storage.save('usuario', { 
  nome: 'Maria', 
  email: 'maria@example.com',
  idade: 28 
});

// Salvar um array
Storage.save('tarefas', [
  { id: 1, titulo: 'Estudar React', concluida: false },
  { id: 2, titulo: 'Fazer exercícios', concluida: true }
]);

// Salvar valores simples
Storage.save('tema', 'dark');
Storage.save('contador', 42);
Storage.save('ativo', true);
```

### 2. Carregar Dados

```typescript
// Carregar com valor padrão
const usuario = Storage.load('usuario', { nome: '', email: '', idade: 0 });
const tarefas = Storage.load('tarefas', []);
const tema = Storage.load('tema', 'light');

// Se a chave não existir, retorna o valor padrão
const config = Storage.load('config', { idioma: 'pt-BR' });
```

### 3. Verificar e Remover

```typescript
// Verificar se existe
if (Storage.has('usuario')) {
  console.log('Usuário está logado!');
}

// Remover um item
Storage.remove('usuario');

// Limpar tudo
Storage.clear();
```

### 4. Utilitários

```typescript
// Listar todas as chaves
const chaves = Storage.keys();
console.log('Chaves armazenadas:', chaves);

// Contar itens
const total = Storage.size();
console.log(`Total de itens: ${total}`);
```

## ⚛️ Hook React - useLocalStorage

Use este hook para ter estado reativo sincronizado com localStorage:

```typescript
import { useLocalStorage } from './utils/storage';

function MeuComponente() {
  // Funciona exatamente como useState, mas persiste os dados!
  const [usuario, setUsuario] = useLocalStorage('usuario', {
    nome: '',
    email: ''
  });

  const [tarefas, setTarefas] = useLocalStorage('tarefas', []);

  const adicionarTarefa = (novaTarefa) => {
    setTarefas([...tarefas, novaTarefa]);
    // Automaticamente salvo no localStorage!
  };

  return (
    <div>
      <h1>Olá, {usuario.nome}</h1>
      <button onClick={() => setUsuario({ nome: 'João', email: 'joao@example.com' })}>
        Atualizar Usuário
      </button>
    </div>
  );
}
```

## 💡 Exemplos Práticos Completos

### Gerenciar Tema Dark/Light

```typescript
import { useLocalStorage } from './utils/storage';

function App() {
  const [tema, setTema] = useLocalStorage('tema', 'light');

  const alternarTema = () => {
    setTema(tema === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={tema}>
      <button onClick={alternarTema}>
        Tema: {tema}
      </button>
    </div>
  );
}
```

### Lista de Tarefas Persistente

```typescript
import { useLocalStorage } from './utils/storage';

interface Tarefa {
  id: number;
  titulo: string;
  concluida: boolean;
}

function TodoList() {
  const [tarefas, setTarefas] = useLocalStorage<Tarefa[]>('tarefas', []);

  const adicionarTarefa = (titulo: string) => {
    const novaTarefa: Tarefa = {
      id: Date.now(),
      titulo,
      concluida: false
    };
    setTarefas([...tarefas, novaTarefa]);
  };

  const toggleTarefa = (id: number) => {
    setTarefas(
      tarefas.map(t => 
        t.id === id ? { ...t, concluida: !t.concluida } : t
      )
    );
  };

  const removerTarefa = (id: number) => {
    setTarefas(tarefas.filter(t => t.id !== id));
  };

  return (
    <div>
      <h1>Minhas Tarefas ({tarefas.length})</h1>
      <ul>
        {tarefas.map(tarefa => (
          <li key={tarefa.id}>
            <input
              type="checkbox"
              checked={tarefa.concluida}
              onChange={() => toggleTarefa(tarefa.id)}
            />
            {tarefa.titulo}
            <button onClick={() => removerTarefa(tarefa.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Formulário com Auto-Save

```typescript
import { useLocalStorage } from './utils/storage';

function FormularioComAutoSave() {
  const [rascunho, setRascunho] = useLocalStorage('rascunho-formulario', {
    nome: '',
    email: '',
    mensagem: ''
  });

  const handleChange = (campo: string, valor: string) => {
    setRascunho({ ...rascunho, [campo]: valor });
  };

  const limparRascunho = () => {
    setRascunho({ nome: '', email: '', mensagem: '' });
  };

  return (
    <form>
      <input
        value={rascunho.nome}
        onChange={(e) => handleChange('nome', e.target.value)}
        placeholder="Nome"
      />
      <input
        value={rascunho.email}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="Email"
      />
      <textarea
        value={rascunho.mensagem}
        onChange={(e) => handleChange('mensagem', e.target.value)}
        placeholder="Mensagem"
      />
      <button type="button" onClick={limparRascunho}>
        Limpar Rascunho
      </button>
    </form>
  );
}
```

## ⚠️ Limitações

- **Tamanho**: localStorage tem limite de ~5-10MB (varia por navegador)
- **Tipo**: Apenas strings (o utilitário converte automaticamente com JSON)
- **Segurança**: Não armazene dados sensíveis (senhas, tokens, etc.)
- **Sincronização**: Dados não são sincronizados entre dispositivos

## 🎯 Quando Usar

✅ **Use para:**
- Preferências do usuário (tema, idioma)
- Rascunhos de formulários
- Estado da UI (abas abertas, filtros)
- Cache de dados não sensíveis
- Listas simples (tarefas, favoritos)

❌ **Não use para:**
- Senhas ou tokens de autenticação
- Grandes volumes de dados (use IndexedDB)
- Dados que precisam ser compartilhados entre dispositivos (use backend)
