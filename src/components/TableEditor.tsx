import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface ColumnRenderProps {
  value: any;
  onChange: (value: any) => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  column: TableColumn;
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'email';
  options?: { value: string | number; label: string }[];
  editable?: boolean;
  sortable?: boolean;
  required?: boolean;
  defaultValue?: any;
  showInForm?: boolean;
  showInTable?: boolean;
  readOnly?: boolean;
  render?: (props: ColumnRenderProps) => React.ReactNode;
}

export interface TableEditorProps {
  title: string;
  columns: TableColumn[];
  data: any[];
  onAdd: (newRecord: any) => Promise<void>;
  onUpdate: (id: string | number, updates: any) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
  idField: string;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
  uniqueFields?: string[]; // Fields that should be unique
}

export function TableEditor({
  title,
  columns,
  data,
  onAdd,
  onUpdate,
  onDelete,
  idField,
  loading = false,
  onRefresh,
  uniqueFields = [],
}: TableEditorProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const editableColumns = useMemo(() => columns.filter(col => col.editable !== false), [columns]);
  const formColumns = useMemo(() => editableColumns.filter(col => col.showInForm !== false), [editableColumns]);
  const visibleColumns = useMemo(() => columns.filter(col => col.showInTable !== false), [columns]);

  const initializeForm = (record?: any) => {
    if (record) {
      setFormData(record);
    } else {
      const newForm: any = {};
      editableColumns.forEach(col => {
        newForm[col.key] = col.defaultValue ?? '';
      });
      setFormData(newForm);
    }
  };

  const handleAddClick = () => {
    initializeForm();
    setEditingId(null);
    setIsAddOpen(true);
  };

  const handleEditClick = (record: any) => {
    initializeForm(record);
    setEditingId(record[idField]);
    setIsAddOpen(true);
  };

  const handleFormChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const missingRequired = editableColumns.some(col => {
        const value = formData[col.key];
        return (
          col.required &&
          (value === '' || value === null || value === undefined)
        );
      });

      if (missingRequired) {
        toast({
          title: 'Missing Fields',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      // Check for duplicate values in unique fields
      if (uniqueFields.length > 0) {
        const duplicateField = uniqueFields.find(field => {
          const currentValue = formData[field];
          if (!currentValue) return false;
          
          // When adding, check all records
          if (!editingId) {
            return data.some(record => 
              String(record[field]).toLowerCase() === String(currentValue).toLowerCase()
            );
          }
          
          // When editing, check all records except the current one
          return data.some(record => 
            record[idField] !== editingId &&
            String(record[field]).toLowerCase() === String(currentValue).toLowerCase()
          );
        });

        if (duplicateField) {
          const fieldLabel = columns.find(col => col.key === duplicateField)?.label || duplicateField;
          toast({
            title: 'Duplicate Entry',
            description: `${fieldLabel} already exists. Please use a unique value.`,
            variant: 'destructive',
          });
          return;
        }
      }

      if (editingId) {
        await onUpdate(editingId, formData);
        toast({
          title: 'Success',
          description: 'Record updated successfully',
        });
      } else {
        await onAdd(formData);
        toast({
          title: 'Success',
          description: 'Record added successfully',
        });
      }

      setIsAddOpen(false);
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await onDelete(id);
      toast({
        title: 'Success',
        description: 'Record deleted successfully',
      });
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete record',
        variant: 'destructive',
      });
    }
  };

  const filteredData = data.filter(record =>
    columns.some(col =>
      String(record[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddClick} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit' : 'Add New'} {title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {formColumns.map(col => (
                  <div key={col.key} className="space-y-2">
                    <label className="text-sm font-medium">{col.label}</label>
                    {col.render ? (
                      <div>
                        {col.render({
                          value: formData[col.key],
                          onChange: (value: any) => handleFormChange(col.key, value),
                          formData,
                          setFormData,
                          column: col,
                        })}
                      </div>
                    ) : col.type === 'select' && col.options ? (
                      <select
                        value={formData[col.key] || ''}
                        onChange={(e) => handleFormChange(col.key, e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">Select {col.label}</option>
                        {col.options.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={col.type || 'text'}
                        value={formData[col.key] || ''}
                        onChange={(e) => handleFormChange(col.key, e.target.value)}
                        placeholder={`Enter ${col.label}`}
                        readOnly={col.readOnly}
                        required={col.required}
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No records found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map(col => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map(record => (
                  <TableRow key={record[idField]}>
                    {visibleColumns.map(col => (
                      <TableCell key={col.key}>
                        {col.type === 'date'
                          ? new Date(record[col.key]).toLocaleDateString()
                          : record[col.key]}
                      </TableCell>
                    ))}
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(record)}
                        className="gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(record[idField])}
                        className="gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
