import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formApi } from '@/services/formApi';
import { FormWithDetails, ResponseWithAnswers, FormField, FormFieldOption } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';

export function FormFiller() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [form, setForm] = useState<FormWithDetails | null>(null);
  const [response, setResponse] = useState<ResponseWithAnswers | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const formData = await formApi.getFormById(id);
      if (!formData) {
        alert('Formulário não encontrado');
        navigate('/pessoas');
        return;
      }

      setForm(formData);

      // Verificar se existe resposta existente
      const responseId = searchParams.get('responseId');
      if (responseId) {
        const responses = await formApi.getUserResponses(user?.id || '');
        const existingResponse = responses.find(r => r.id === responseId);

        if (existingResponse) {
          setResponse(existingResponse);
          setIsReadOnly(existingResponse.status === 'SUBMITTED');

          // Carregar respostas existentes
          const answersMap: Record<string, string | string[] | number> = {};
          existingResponse.answers?.forEach(answer => {
            answersMap[answer.fieldId] = answer.value;
          });
          setAnswers(answersMap);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      alert('Erro ao carregar formulário. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form || !user) return;

    try {
      setSaving(true);

      // Preparar respostas
      const answersToSave = Object.entries(answers).map(([fieldId, value]) => ({
        fieldId,
        value
      }));

      // Enviar tudo junto (backend lida com update se já existir)
      const responseData = await formApi.createResponse({
        formId: form.id,
        userId: user.id,
        userName: user.name,
        status: 'DRAFT',
        answers: answersToSave
      });

      setResponse(responseData as any);
      alert('Rascunho salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      alert('Erro ao salvar rascunho. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!form || !user) return;

    // Validar campos obrigatórios
    const requiredFields = form.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !answers[f.id] || answers[f.id] === '');

    if (missingFields.length > 0) {
      alert(`Por favor, preencha todos os campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    if (!confirm('Tem certeza que deseja enviar este formulário? Após o envio, não será possível editar as respostas.')) {
      return;
    }

    try {
      setSaving(true);

      // Preparar respostas
      const answersToSave = Object.entries(answers).map(([fieldId, value]) => ({
        fieldId,
        value
      }));

      // Enviar tudo junto
      await formApi.createResponse({
        formId: form.id,
        userId: user.id,
        userName: user.name,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        answers: answersToSave
      });

      alert('Formulário enviado com sucesso!');
      navigate('/pessoas');
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error);
      // ✅ Tratamento específico para erro 409 (já respondeu)
      if (error.response?.status === 409 || error.message?.includes('409')) {
        alert('Você já respondeu este formulário.');
      } else {
        alert('Erro ao enviar formulário. Por favor, tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = answers[field.id];
    const isRequired = field.required;
    const optionalLabel = !isRequired ? ' (opcional)' : '';

    // ✅ CORREÇÃO: Normalizar o tipo do campo (aceita field.type OU field.field_type)
    const fieldType = (field.type || (field as any).field_type || '').toUpperCase();

    console.log(`[FormFiller] Rendering field: "${field.label}" with type: "${fieldType}"`);

    switch (fieldType) {
      case 'SHORT_TEXT':
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <Input
              type={fieldType === 'EMAIL' ? 'email' : fieldType === 'URL' ? 'url' : 'text'}
              value={(value as string) || ''}
              onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
              placeholder={field.config?.placeholder || 'Texto de resposta curta'}
              disabled={isReadOnly}
              required={isRequired}
            />
          </div>
        );

      case 'LONG_TEXT':
      case 'TEXTAREA':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <Textarea
              value={(value as string) || ''}
              onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
              placeholder={field.config?.placeholder || 'Texto de resposta longa'}
              disabled={isReadOnly}
              required={isRequired}
              rows={4}
            />
          </div>
        );

      case 'MULTIPLE_CHOICE':
      case 'RADIO':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <RadioGroup
              value={(value as string) || ''}
              onValueChange={(val) => setAnswers({ ...answers, [field.id]: val })}
              disabled={isReadOnly}
            >
              {(field.config?.options || []).map((option: FormFieldOption) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.id}`} />
                  <Label htmlFor={`${field.id}-${option.id}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'CHECKBOXES':
      case 'CHECKBOX':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <div className="space-y-2">
              {(field.config?.options || []).map((option: FormFieldOption) => {
                const checked = Array.isArray(value) && value.includes(option.value);
                return (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${option.id}`}
                      checked={checked}
                      onCheckedChange={(checked) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = checked
                          ? [...currentValues, option.value]
                          : currentValues.filter((v: string) => v !== option.value);
                        setAnswers({ ...answers, [field.id]: newValues });
                      }}
                      disabled={isReadOnly}
                    />
                    <Label htmlFor={`${field.id}-${option.id}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'SCALE': {
        const minValue = field.config?.minValue || 1;
        const maxValue = field.config?.maxValue || 5;
        const options = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <div className="flex items-center gap-4">
              {field.config?.minLabel && (
                <span className="text-sm text-gray-600">{field.config.minLabel}</span>
              )}
              <RadioGroup
                value={value?.toString() || ''}
                onValueChange={(val) => setAnswers({ ...answers, [field.id]: parseInt(val) })}
                disabled={isReadOnly}
                className="flex gap-2"
              >
                {options.map((num) => (
                  <div key={num} className="flex flex-col items-center">
                    <RadioGroupItem value={num.toString()} id={`${field.id}-${num}`} />
                    <Label htmlFor={`${field.id}-${num}`} className="font-normal text-sm mt-1">
                      {num}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {field.config?.maxLabel && (
                <span className="text-sm text-gray-600">{field.config.maxLabel}</span>
              )}
            </div>
          </div>
        );
      }

      case 'DATE':
      case 'DATETIME':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <Input
              type={fieldType === 'DATETIME' ? 'datetime-local' : 'date'}
              value={(value as string) || ''}
              onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
              disabled={isReadOnly}
              required={isRequired}
            />
          </div>
        );

      case 'NUMBER':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <Input
              type="number"
              value={(value as number) || ''}
              onChange={(e) => setAnswers({ ...answers, [field.id]: parseFloat(e.target.value) })}
              placeholder={field.config?.placeholder}
              disabled={isReadOnly}
              required={isRequired}
            />
          </div>
        );

      case 'DROPDOWN':
      case 'SELECT':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <Select
              value={(value as string) || ''}
              onValueChange={(val) => setAnswers({ ...answers, [field.id]: val })}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {(field.config?.options || []).map((option: FormFieldOption) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'FILE':
      case 'IMAGE':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}{optionalLabel} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && <p className="text-sm text-gray-600">{field.helpText}</p>}
            <Input
              type="file"
              accept={fieldType === 'IMAGE' ? 'image/*' : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAnswers({ ...answers, [field.id]: file.name });
                }
              }}
              disabled={isReadOnly}
              required={isRequired}
            />
            <p className="text-xs text-gray-500">
              Nota: Upload de arquivos será implementado em versão futura
            </p>
          </div>
        );

      default:
        console.warn(`[FormFiller] ⚠️ Unsupported field type: "${fieldType}" for field "${field.label}"`);
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label} (Tipo não suportado: {fieldType})</Label>
            <p className="text-sm text-red-600">Este tipo de campo ainda não é suportado.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Carregando formulário...</div>
        </div>
      </Layout>
    );
  }

  if (!form) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Formulário não encontrado</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/pessoas')} className="text-white hover:text-white/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {!isReadOnly && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="text-white border-white hover:bg-white/10 hover:text-white">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                <Send className="mr-2 h-4 w-4" />
                {saving ? 'Enviando...' : 'Enviar Formulário'}
              </Button>
            </div>
          )}
        </div>

        {/* Cabeçalho do Formulário */}
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <p className="text-gray-700 mt-2 whitespace-pre-wrap">{form.description}</p>
            )}
            {isReadOnly && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                <p className="text-sm text-green-800 font-semibold">
                  ✓ Este formulário já foi enviado. Você está visualizando suas respostas.
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Campos sem seção */}
        {form.fields.filter(f => !f.sectionId).length > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              {form.fields
                .filter(f => !f.sectionId)
                .sort((a, b) => a.order - b.order)
                .map(renderField)}
            </CardContent>
          </Card>
        )}

        {/* Seções */}
        {form.sections.sort((a, b) => a.order - b.order).map((section) => {
          const sectionFields = form.fields
            .filter(f => f.sectionId === section.id)
            .sort((a, b) => a.order - b.order);

          console.log(`[FormFiller] Rendering section: "${section.title}" (ID: ${section.id})`);
          console.log(`[FormFiller] Fields found for this section: ${sectionFields.length}`);
          sectionFields.forEach(f => console.log(`  - Field: "${f.label}" (Type: ${(f as any).field_type || f.type})`));

          // Só renderizar seção se houver campos
          if (sectionFields.length === 0) {
            console.warn(`[FormFiller] ⚠ Section "${section.title}" has NO fields - skipping render`);
            return null;
          }

          return (
            <Card key={section.id}>
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-xl">{section.title}</CardTitle>
                {section.description && (
                  <p className="text-gray-700 mt-1">{section.description}</p>
                )}
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {sectionFields.map(renderField)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
