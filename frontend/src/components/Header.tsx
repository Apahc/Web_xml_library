import { AppBar, Toolbar, Typography } from '@mui/material'

export default function Header() {
  return (
    <AppBar position="static" color="primary" sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          &lt;/&gt; XML Tree Viewer
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
