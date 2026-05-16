import { createClient } from '@/lib/supabase/server'
import { NewComicForm } from '@/components/creator/NewComicForm'

export const metadata = { title: 'Nueva Obra — Panel Creador' }

export default async function NewComicPage() {
  const supabase = createClient()
  const { data: genres } = await supabase
    .from('genres')
    .select('*')
    .order('name')

  return <NewComicForm genres={genres || []} />
}
