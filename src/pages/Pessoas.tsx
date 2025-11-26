import { useAuth } from '@/contexts/AuthContext';
import { AdminFormsView } from '@/components/pessoas/AdminFormsView';
import { UserFormsView } from '@/components/pessoas/UserFormsView';
import { Layout } from '@/components/layout/Layout';

export default function Pessoas() {
  const { user } = useAuth();

  // Administradores veem a interface de gerenciamento
  // Usuários comuns veem apenas os formulários para preencher
  return (
    <Layout>
      {user?.role === 'ADMIN' ? <AdminFormsView /> : <UserFormsView />}
    </Layout>
  );
}