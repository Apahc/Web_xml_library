import { MenuItem, Select } from '@mui/material'
import type { Structure } from '../types/models'

export default function StructureSelect({
  structures
}: {
  structures: Structure[]
}) {
  return (
    <Select fullWidth defaultValue="">
      {structures.map(s => (
        <MenuItem key={s.id} value={s.id}>
          {s.name}
        </MenuItem>
      ))}
    </Select>
  )
}
