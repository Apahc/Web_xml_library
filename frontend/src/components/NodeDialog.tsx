import { Dialog, DialogTitle, DialogContent, List, ListItem } from '@mui/material'
import type { NodeDetails } from '../types/models'

export default function NodeDialog({
  open,
  details,
  onClose
}: {
  open: boolean
  details: NodeDetails | null
  onClose: () => void
}) {
  if (!details) return null
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Node Details</DialogTitle>
      <DialogContent>
        <pre style={{ backgroundColor: '#f5f7fa', padding: 8, borderRadius: 4 }}>
          {JSON.stringify(details.attrs, null, 2)}
        </pre>
        <List>
          {details.docs.map((doc) => (
            <ListItem key={doc}>{doc}</ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}
