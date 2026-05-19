export type Goal = 'weight_gain' | 'weight_loss' | 'recovery' | 'maintenance';
export type WorkoutType = 'strength' | 'functional';
export type Category = 'chest_biceps' | 'back_triceps' | 'legs_shoulders' | 'full_body' | 'functional' | 'other';

export interface Questionnaire {
  id: number;
  had_training_before: boolean | null;
  previous_sports: string | null;
  time_since_last_workout: string | null;
  physical_limitations: string | null;
  joint_pain: string | null;
  pressure_issues: string | null;
  surgeries: string | null;
  congenital_conditions: string | null;
  gi_issues: string | null;
  spine_conditions: string | null;
  chest_pain: string | null;
  supplements: string | null;
  fitness_level: number | null;
  age: number | null;
  height: number | null;
  weight: number | null;
}

export interface Client {
  id: number;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  telegram_username: string | null;
  goal: Goal;
  target_weight: number | null;
  is_active: boolean;
  created_at: string;
  questionnaire: Questionnaire | null;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  workout_type: string;
  muscle_group: string | null;
}

export interface WorkoutSet {
  id: number;
  exercise_id: number;
  exercise_name: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  notes: string | null;
}

export interface WorkoutSession {
  id: number;
  client_id: number;
  date: string;
  workout_type: WorkoutType;
  category: string | null;
  is_completed: boolean;
  sets: WorkoutSet[];
}

export interface TrainerStats {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  sessions_today: number;
  sessions_this_week: number;
}

export interface CurrentUser {
  id: number;
  telegram_id: string;
  first_name: string;
  last_name: string | null;
  telegram_username: string | null;
  role: 'trainer' | 'client';
  client: Client | null;
}

export interface BodyMeasurement {
  id: number;
  client_id: number;
  date: string;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arm: number | null;
  thigh: number | null;
  notes: string | null;
}

export interface ClientStats {
  sessions_this_month: number;
  sessions_this_week: number;
  goal: Goal | null;
  last_measurement: { weight: number; date: string } | null;
  target_weight: number | null;
  current_weight: number | null;
  weight_to_go: number | null;
}
