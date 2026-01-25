import { useState, useEffect } from 'react';
import { 
  Typography, 
  TextField, 
  List,  
  ListItemButton, 
  ListItemText, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import { getStructures } from '../api/api';
import type { Structure } from '../types/models';

interface XMLStructurePanelProps {
  onSelectStructure?: (id: number) => void; 
}

export default function XMLStructurePanel({ onSelectStructure }: XMLStructurePanelProps) {
  const [search, setSearch] = useState('');
  const [allStructures, setAllStructures] = useState<Structure[]>([]);
  const [filteredStructures, setFilteredStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Structure | null>(null);

  // Загружаем ВСЕ структуры один раз
  useEffect(() => {
    setLoading(true);
    getStructures()
      .then(data => {
        console.log('Все структуры с бэка:', data);
        setAllStructures(data || []);
        setFilteredStructures(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Не удалось загрузить структуры');
        setLoading(false);
      });
  }, []);

  // Локальный фильтр по поиску
  useEffect(() => {
    if (!search.trim()) {
      setFilteredStructures(allStructures);
      return;
    }

    const lowerSearch = search.toLowerCase();
    const filtered = allStructures.filter(item =>
      (item.name?.toLowerCase().includes(lowerSearch)) ||
      (item.description?.toLowerCase().includes(lowerSearch)) ||
      (item.id?.toString().includes(lowerSearch))
    );
    setFilteredStructures(filtered);
  }, [search, allStructures]);

  const handleSelect = (item: Structure) => {
    setSelectedItem(item);
    if (onSelectStructure) {
      onSelectStructure(Number(item.id)); // ← передаём id наверх в App
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <div style={{ padding: 16 }}>
      <Typography variant="h5" gutterBottom>
        Структуры и поиск
      </Typography>

      <TextField
        fullWidth
        label="Поиск по названию, описанию или ID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {filteredStructures.length === 0 ? (
        <Typography color="text.secondary">
          {search.trim() ? 'Ничего не найдено' : 'Структур пока нет. Загрузи XML.'}
        </Typography>
      ) : (
        <List sx={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
          {filteredStructures.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => handleSelect(item)}
              selected={selectedItem?.id === item.id}
            >
              <ListItemText
                primary={item.name || 'Без названия'}
                secondary={`ID: ${item.id} | Описание: ${item.description || 'нет'}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}

      {selectedItem && (
        <div style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="h6" gutterBottom>
            Выбранная структура
          </Typography>
          <pre style={{ fontSize: 13, background: '#fff', padding: 12, borderRadius: 4, overflowX: 'auto' }}>
            {JSON.stringify(selectedItem, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}