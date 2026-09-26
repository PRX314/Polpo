import { useContext } from 'react'
import { DataContext } from './dataContext'

export const useData = () => useContext(DataContext)
