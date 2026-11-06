// Chi risponde in chat: Peppino generico, oppure uno degli specialisti definiti sul server.
export const GENERICO = { id: null, name: 'Peppino', description: 'Progetti, idee, priorità e piani' }

export const nomeAssistente = (specialisti, id) =>
  (id && specialisti.find(s => s.id === id)?.name) || GENERICO.name
