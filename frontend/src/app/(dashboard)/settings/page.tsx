"use client";

import { Settings as SettingsIcon, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
          Gerencie as configurações do sistema
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900">
        <CardContent className="p-12 text-center">
          <div className="mx-auto mb-6 inline-block rounded-full bg-purple-500 p-6">
            <Construction className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Em Desenvolvimento
          </h2>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">
            A página de configurações está sendo desenvolvida e estará disponível em breve.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Preferências</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Integrações</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Notificações</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
