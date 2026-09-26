import { useLocation, useNavigate } from 'react-router-dom'
import AiChat from '../components/AiChat'

// Il messaggio scritto nella pagina Oggi arriva qui nello stato dell'indirizzo
const ChatPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const initialMessage = location.state?.message || ''

  return (
    <AiChat
      initialMessage={initialMessage}
      onInitialMessageConsumed={() => navigate(location.pathname, { replace: true, state: null })}
    />
  )
}

export default ChatPage
