import { useEffect, useState } from 'react';
import { trainerApi } from '../api/client';
import WorkoutFlow from './WorkoutFlow';
import Layout from '../components/Layout';
import type { CurrentUser } from '../types';

interface Props {
  currentUser: CurrentUser;
}

export default function TrainerWorkoutPage({ currentUser }: Props) {
  const [selfClient, setSelfClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trainerApi
      .getMyClientProfile()
      .then(setSelfClient)
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout title="Моя тренировка">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>Загрузка...</div>
      </Layout>
    );
  }

  if (error || !selfClient) {
    return (
      <Layout title="Моя тренировка">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#c00' }}>{error}</div>
      </Layout>
    );
  }

  const trainerAsClient: CurrentUser = {
    ...currentUser,
    role: 'client',
    client: selfClient,
  };

  return <WorkoutFlow currentUser={trainerAsClient} />;
}
