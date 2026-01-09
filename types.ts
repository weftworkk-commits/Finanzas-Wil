
export interface DayRecord {
  id: string;
  day: string;
  gain: number;
  date: string;
}

export enum GastoCategory {
  Entretenimiento = 'Entretenimiento',
  Salidas = 'Salidas',
  Alimentacion = 'Alimentación',
  Personal = 'Personal',
  Regalos = 'Regalos',
  Educacion = 'Educación',
  Otros = 'Otros'
}

export interface GastoRecord {
  id: string;
  date: string;
  amount: number;
  category: GastoCategory;
  description: string;
}

export type Section = 'Cambios' | 'Gastos';
