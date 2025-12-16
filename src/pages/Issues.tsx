import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssueBookForm } from '@/components/issues/IssueBookForm';
import { ReturnBookForm } from '@/components/issues/ReturnBookForm';
import { ActiveIssues } from '@/components/issues/ActiveIssues';

export default function Issues() {
  return (
    <MainLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-6">Issue & Return Books</h1>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Issues</TabsTrigger>
            <TabsTrigger value="issue">Issue Book</TabsTrigger>
            <TabsTrigger value="return">Return Book</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <ActiveIssues />
          </TabsContent>

          <TabsContent value="issue" className="mt-6">
            <IssueBookForm />
          </TabsContent>

          <TabsContent value="return" className="mt-6">
            <ReturnBookForm />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
