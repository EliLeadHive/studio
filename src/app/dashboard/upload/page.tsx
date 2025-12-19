'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadAdsData } from '@/lib/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadSuccess(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Arquivo Inválido',
          description: 'Por favor, selecione um arquivo no formato CSV.',
        });
        setFile(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Nenhum Arquivo',
        description: 'Por favor, selecione um arquivo para enviar.',
      });
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const result = await uploadAdsData(formData);

    if (result.success) {
      setUploadSuccess(true);
      toast({
        title: 'Upload Concluído!',
        description: `${result.rowCount} linhas de dados foram processadas com sucesso.`,
      });
      setFile(null); // Clear file after successful upload
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: result.error || 'Ocorreu um erro desconhecido.',
      });
    }

    setIsUploading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      <Card className="max-w-2xl mx-auto bg-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload de Dados do Meta Ads
          </CardTitle>
          <CardDescription>
            Faça o upload do seu arquivo CSV exportado do Gerenciador de Anúncios da Meta. Os dados do upload serão substituídos pela sincronização com o Google Sheets, se configurada.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Alert variant="default" className="mb-6 bg-blue-500/10 border-blue-500/30 text-foreground">
              <AlertTriangle className="h-4 w-4 text-blue-400" />
              <AlertDescription>
                Esta página permite uma atualização manual. Se uma URL do Google Sheets estiver configurada, os dados serão sincronizados automaticamente, substituindo qualquer upload manual.
              </AlertDescription>
            </Alert>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-primary" />
                  <span className="font-medium text-foreground">{file.name}</span>
                  <p className="text-sm text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}>
                    <X className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <p className="mt-4 font-semibold text-foreground">Clique para selecionar um arquivo</p>
                  <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
                  <p className="text-xs text-muted-foreground mt-2">Apenas arquivos .CSV</p>
                </>
              )}
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".csv"
                disabled={isUploading}
              />
            </div>
            {uploadSuccess && (
                <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-md">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">Dados de anúncio atualizados!</p>
                </div>
            )}
            <Button type="submit" className="w-full" disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Enviar Arquivo'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
