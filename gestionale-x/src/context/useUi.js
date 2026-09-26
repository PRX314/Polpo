import { useContext } from 'react'
import { UiContext } from './uiContext'

export const useUi = () => useContext(UiContext)
