import { getTypeInfo } from '../../itemTypes'

const TypeTag = ({ type }) => <span className="tag tag-type">{getTypeInfo(type).label}</span>

export default TypeTag
