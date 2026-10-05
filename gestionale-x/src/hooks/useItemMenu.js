import { Archive, ArchiveRestore, BookOpen, Copy, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { useData } from '../context/useData'
import { useUi } from '../context/useUi'
import { linkVault, haVault } from '../vault'

// Voci del menu di un elemento: le usano sia la scheda sia la pagina di dettaglio.
export const useItemMenu = (project, { afterDelete } = {}) => {
  const { actions } = useData()
  const { openForm, confirmDelete } = useUi()
  return [
    { label: project.pinned ? 'Togli dal primo piano' : 'Metti in primo piano', icon: project.pinned ? PinOff : Pin, onClick: () => actions.togglePin(project) },
    { label: 'Modifica', icon: Pencil, onClick: () => openForm({ project }) },
    { label: 'Duplica', icon: Copy, onClick: () => actions.duplicate(project) },
    { label: project.archived ? 'Ripristina' : 'Archivia', icon: project.archived ? ArchiveRestore : Archive, onClick: () => actions.toggleArchive(project) },
    haVault(project) && { label: 'Apri in Obsidian', icon: BookOpen, href: linkVault(project) },
    'sep',
    { label: 'Elimina…', icon: Trash2, onClick: () => confirmDelete(project, afterDelete) }
  ]
}
