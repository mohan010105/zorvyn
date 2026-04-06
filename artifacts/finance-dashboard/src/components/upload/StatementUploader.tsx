import React, { useCallback, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/lib/ai-insights';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onUploadSuccess: (transactions: Omit<Transaction, 'id'>[]) => void;
}

const StatementUploader: React.FC<Props> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const categorizeDescription = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('uber') || d.includes('lyft') || d.includes('transport') || d.includes('train') || d.includes('gas')) return 'Transport';
    if (d.includes('amazon') || d.includes('walmart') || d.includes('target') || d.includes('shopping')) return 'Shopping';
    if (d.includes('restaurant') || d.includes('mcdonald') || d.includes('starbucks') || d.includes('food') || d.includes('dining')) return 'Food';
    if (d.includes('salary') || d.includes('payroll') || d.includes('deposit')) return 'Salary';
    if (d.includes('rent') || d.includes('mortgage')) return 'Housing';
    if (d.includes('netflix') || d.includes('spotify') || d.includes('hulu') || d.includes('entertainment')) return 'Entertainment';
    if (d.includes('utility') || d.includes('electric') || d.includes('water') || d.includes('internet')) return 'Utilities';
    return 'General';
  };

  const processFile = async (selectedFile: File) => {
    setIsProcessing(true);
    setProgress(10);
    
    try {
      let results: any[] = [];
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        results = await parseCSV(selectedFile);
      } else if (extension === 'xlsx') {
        results = await parseExcel(selectedFile);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or XLSX.');
      }

      setProgress(60);

      const transactions: Omit<Transaction, 'id'>[] = results.map(row => {
        // Assume column names from various statement formats
        const date = row.Date || row.date || row.timestamp || new Date().toISOString().split('T')[0];
        const description = row.Description || row.description || row.memo || row.Memo || row.Payee || 'Unnamed Transaction';
        const rawAmount = row.Amount || row.amount || row.value || row.Value || 0;
        const categoryInput = row.Category || row.category || row.type_tag || '';

        const amount = parseFloat(String(rawAmount).replace(/[^\d.-]/g, ''));
        const type = amount >= 0 ? 'income' : 'expense';
        const absAmount = Math.abs(amount).toString();
        const category = categoryInput || categorizeDescription(description);

        return {
          date: (() => {
            const d = new Date(date);
            return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
          })(),
          description,
          amount: absAmount,
          category,
          type: type as 'income' | 'expense'
        };
      }).filter(tx => !isNaN(parseFloat(tx.amount)));

      setProgress(90);
      
      if (transactions.length === 0) {
        throw new Error('No valid transactions found in file.');
      }

      setTimeout(() => {
        onUploadSuccess(transactions);
        setProgress(100);
        setIsProcessing(false);
        setFile(null);
        toast({
          title: "Success!",
          description: `Imported ${transactions.length} transactions successfully.`,
        });
      }, 500);

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error processing file",
        description: error.message || "Something went wrong while parsing the file.",
        variant: "destructive"
      });
      setIsProcessing(false);
      setProgress(0);
      setFile(null);
    }
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-200 text-center ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[1.01]' 
            : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
        } ${isProcessing ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
          </div>
          <div>
            <h3 className="text-lg font-bold">Upload Bank Statement</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Drag and drop your CSV or XLSX file here, or click to browse
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded">CSV</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded">XLSX</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border/40"
          >
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Parsing financial data...
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-1">Expected Format:</p>
          Columns should ideally include: <code className="bg-background px-1 rounded">Date</code>, <code className="bg-background px-1 rounded">Description</code>, and <code className="bg-background px-1 rounded">Amount</code>.
          Negative amounts are treated as expenses, positive as income.
        </div>
      </div>
    </div>
  );
};

export default StatementUploader;
