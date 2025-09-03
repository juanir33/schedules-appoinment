interface BusinessHour {
  day: string;
  hours: string;
}

interface GroupedBusinessHour {
  days: string;
  hours: string;
}

// Orden de los días de la semana
const dayOrder = {
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6,
  'domingo': 7
};

// Función para normalizar el nombre del día
const normalizeDayName = (day: string): string => {
  return day.toLowerCase().trim();
};

// Función para obtener el orden del día
const getDayOrder = (day: string): number => {
  const normalizedDay = normalizeDayName(day);
  return dayOrder[normalizedDay as keyof typeof dayOrder] || 999;
};

// Función para formatear rangos de días consecutivos
const formatDayRange = (days: string[]): string => {
  if (days.length === 1) {
    return days[0];
  }
  
  if (days.length === 2) {
    return `${days[0]} y ${days[1]}`;
  }
  
  // Para 3 o más días, verificar si son consecutivos
  const sortedDays = days.sort((a, b) => getDayOrder(a) - getDayOrder(b));
  const dayNumbers = sortedDays.map(getDayOrder);
  
  // Verificar si son consecutivos
  let isConsecutive = true;
  for (let i = 1; i < dayNumbers.length; i++) {
    if (dayNumbers[i] !== dayNumbers[i - 1] + 1) {
      isConsecutive = false;
      break;
    }
  }
  
  if (isConsecutive && days.length > 2) {
    return `${sortedDays[0]} a ${sortedDays[sortedDays.length - 1]}`;
  }
  
  // Si no son consecutivos, listar todos
  if (days.length > 2) {
    const lastDay = sortedDays.pop();
    return `${sortedDays.join(', ')} y ${lastDay}`;
  }
  
  return days.join(', ');
};

// Función principal para procesar y agrupar horarios de negocio
export const formatBusinessHours = (businessHours: BusinessHour[]): GroupedBusinessHour[] => {
  if (!businessHours || businessHours.length === 0) {
    return [
      { days: 'Lunes a Viernes', hours: '9:00 - 18:00' },
      { days: 'Sábados', hours: '9:00 - 16:00' },
      { days: 'Domingos', hours: 'Cerrado' }
    ];
  }
  
  // Agrupar días por horario
  const hourGroups: { [key: string]: string[] } = {};
  
  businessHours.forEach(({ day, hours }) => {
    const normalizedHours = hours.trim();
    if (!hourGroups[normalizedHours]) {
      hourGroups[normalizedHours] = [];
    }
    hourGroups[normalizedHours].push(day);
  });
  
  // Convertir grupos a formato final
  const result: GroupedBusinessHour[] = [];
  
  Object.entries(hourGroups).forEach(([hours, days]) => {
    // Ordenar días dentro del grupo
    const sortedDays = days.sort((a, b) => getDayOrder(a) - getDayOrder(b));
    
    result.push({
      days: formatDayRange(sortedDays),
      hours
    });
  });
  
  // Ordenar grupos por el primer día de cada grupo
  result.sort((a, b) => {
    const firstDayA = a.days.split(/[ay,]/)[0].trim();
    const firstDayB = b.days.split(/[ay,]/)[0].trim();
    return getDayOrder(firstDayA) - getDayOrder(firstDayB);
  });
  
  return result;
};

// Función para capitalizar la primera letra
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Función para formatear un grupo de horarios para mostrar
export const formatBusinessHoursDisplay = (businessHours: BusinessHour[]): string[] => {
  const grouped = formatBusinessHours(businessHours);
  return grouped.map(({ days, hours }) => `${capitalizeFirst(days)}: ${hours}`);
};