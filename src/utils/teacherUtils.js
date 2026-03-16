/**
 * Normaliza datos de profesor de diferentes fuentes de API
 * Maneja variaciones en estructura de datos (user nodo, campos alternativos, etc)
 */
export const normalizeTeacher = (teacher) => {
  const userNode = teacher?.user || teacher
  return {
    id: teacher?.id ?? userNode?.id,
    name: teacher?.name ?? userNode?.name ?? '',
    subject: teacher?.subject ?? teacher?.specialty ?? userNode?.subject ?? '',
    rating: teacher?.rating ?? userNode?.rating ?? null,
    students_count: teacher?.students_count ?? teacher?.students ?? userNode?.students_count ?? 0,
    avatar_url: teacher?.avatar_url ?? userNode?.avatar_url ?? null,
    bio: teacher?.bio ?? userNode?.bio ?? '',
    price_per_hour: teacher?.price_per_hour ?? userNode?.price_per_hour ?? null,
    price: teacher?.price ?? userNode?.price ?? null,
    image: teacher?.image ?? userNode?.image ?? null,
    experience_years: teacher?.experience_years ?? userNode?.experience_years ?? null,
    education: teacher?.education ?? userNode?.education ?? '',
    email: teacher?.email ?? userNode?.email ?? '',
  }
}
