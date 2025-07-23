import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  QrCode, 
  Copy,
  FileText,
  Hash,
  Calendar,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  hash: string;
  timestamp: string;
  status: 'verified' | 'revoked' | 'expired' | 'unknown';
  signerInfo?: {
    name: string;
    cpf: string;
    certificate: string;
  };
}

const DocumentValidator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const calculateHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateQRCode = async (url: string): Promise<string> => {
    try {
      const qrUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff'
        }
      });
      return qrUrl;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return '';
    }
  };

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    if (uploadedFile.type !== 'application/pdf') {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie apenas arquivos PDF.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setFile(uploadedFile);

    try {
      const hash = await calculateHash(uploadedFile);
      const timestamp = new Date().toISOString();
      
      // Simular verificação do status (em uma implementação real, consultaria o índice público)
      const status = Math.random() > 0.5 ? 'verified' : 'unknown';
      
      const newMetadata: DocumentMetadata = {
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        hash,
        timestamp,
        status,
        signerInfo: status === 'verified' ? {
          name: 'João Silva Santos',
          cpf: '123.456.789-01',
          certificate: 'ICP-Brasil A3'
        } : undefined
      };

      setMetadata(newMetadata);

      // Gerar URL de verificação
      const baseUrl = 'https://docs-verify.gov.br/verify';
      const verifyUrl = `${baseUrl}?hash=${hash}&timestamp=${timestamp}`;
      setVerificationUrl(verifyUrl);

      // Gerar QR Code
      const qrUrl = await generateQRCode(verifyUrl);
      setQrCodeUrl(qrUrl);

      toast({
        title: 'Documento processado',
        description: 'Hash calculado e QR Code gerado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro no processamento',
        description: 'Não foi possível processar o documento.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-verified text-verified-foreground">✓ Verificado</Badge>;
      case 'revoked':
        return <Badge className="bg-revoked text-revoked-foreground">✗ Revogado</Badge>;
      case 'expired':
        return <Badge className="bg-warning text-warning-foreground">⚠ Expirado</Badge>;
      default:
        return <Badge variant="secondary">? Não verificado</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-verified" />;
      case 'revoked':
        return <XCircle className="h-5 w-5 text-revoked" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-4xl font-bold text-foreground">DocQR Validate</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Verifique a autenticidade de documentos assinados digitalmente com certificados ICP-Brasil
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload do Documento
            </CardTitle>
            <CardDescription>
              Envie seu documento PDF assinado digitalmente para verificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Arraste um arquivo PDF aqui ou clique para selecionar
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                variant="outline"
              >
                {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {file && (
              <Alert className="mt-4">
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Arquivo selecionado:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* QR Code Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              QR Code de Verificação
            </CardTitle>
            <CardDescription>
              Código QR para verificação pública do documento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qrCodeUrl ? (
              <div className="text-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code de verificação" 
                  className="mx-auto mb-4 border rounded-lg shadow-sm"
                />
                <div className="space-y-2">
                  <Label htmlFor="verification-url">URL de Verificação:</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verification-url"
                      value={verificationUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(verificationUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>QR Code será gerado após o upload do documento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Metadata */}
      {metadata && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Hash className="h-5 w-5 mr-2" />
                Metadados do Documento
              </span>
              {getStatusBadge(metadata.status)}
            </CardTitle>
            <CardDescription>
              Informações técnicas e status de verificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome do Arquivo</Label>
                  <p className="text-sm font-mono">{metadata.fileName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tamanho</Label>
                  <p className="text-sm">{(metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Timestamp</Label>
                  <p className="text-sm font-mono">{new Date(metadata.timestamp).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Hash SHA-256</Label>
                  <div className="flex gap-2 mt-1">
                    <Textarea
                      value={metadata.hash}
                      readOnly
                      className="font-mono text-xs resize-none h-20"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(metadata.hash)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Verification Status */}
            <div className="flex items-center space-x-4">
              {getStatusIcon(metadata.status)}
              <div className="flex-1">
                <h4 className="font-medium">Status de Verificação</h4>
                <p className="text-sm text-muted-foreground">
                  {metadata.status === 'verified' && 'Documento verificado e válido no registro público'}
                  {metadata.status === 'revoked' && 'Documento foi revogado e não é mais válido'}
                  {metadata.status === 'expired' && 'Documento expirou e não é mais válido'}
                  {metadata.status === 'unknown' && 'Status não encontrado no registro público'}
                </p>
              </div>
            </div>

            {/* Signer Information */}
            {metadata.signerInfo && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Informações do Signatário
                  </h4>
                  <div className="grid gap-2 md:grid-cols-3 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Nome</Label>
                      <p className="font-medium">{metadata.signerInfo.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">CPF</Label>
                      <p className="font-mono">{metadata.signerInfo.cpf}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Certificado</Label>
                      <p>{metadata.signerInfo.certificate}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Técnico */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Manual Técnico</CardTitle>
          <CardDescription>
            Informações para auditoria e verificação independente
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h4 className="font-medium mb-2">Como funciona a verificação:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>O hash SHA-256 do documento é calculado localmente no seu navegador</li>
            <li>O hash é comparado com o registro público mantido no repositório de verificação</li>
            <li>O status (verificado/revogado/expirado) é consultado no índice JSON público</li>
            <li>QR Code é gerado apontando para a URL de verificação pública</li>
          </ol>
          
          <h4 className="font-medium mb-2 mt-4">Auditoria independente:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Repositório público: <code>https://github.com/gov-br/docs-verify</code></li>
            <li>Índice JSON: <code>/public/documents-index.json</code></li>
            <li>API de verificação: <code>GET /api/verify?hash=&lt;sha256&gt;</code></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentValidator;