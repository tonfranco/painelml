"use client";

import { MessageCircle, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function QuestionsPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Perguntas
        </h1>
        <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
          Gerencie as perguntas dos seus clientes
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
        <CardContent className="p-12 text-center">
          <div className="mx-auto mb-6 inline-block rounded-full bg-amber-500 p-6">
            <Construction className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Em Desenvolvimento
          </h2>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">
            A funcionalidade de perguntas está sendo desenvolvida e estará disponível em breve.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Responder perguntas</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Gerenciar SLA</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Notificações</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
