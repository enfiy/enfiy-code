/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Modifications Copyright 2025 The Enfiy Community Contributors
 *
 * This file has been modified from its original version by contributors
 * to the Enfiy Community project.
 */

export type SupportedLanguage = 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'ru';

export interface TranslationKeys {
  // App messages
  welcomeTitle: string;
  welcomeMessage: string;
  keyFeatures: string;
  featureFileOps: string;
  featureCodeSearch: string;
  featureShellCommands: string;
  featureSuggestions: string;
  helpMessage: string;
  
  // Provider selection
  providerSelectionTitle: string;
  selectCategoryPrompt: string;
  selectProviderPrompt: string;
  selectModelPrompt: string;
  localAI: string;
  cloudAI: string;
  localAIDescription: string;
  cloudAIDescription: string;
  
  // Tips
  tipsTitle: string;
  tipProvider: string;
  tipGeneral: string;
  tipSpecific: string;
  tipMemory: string;
  tipHelp: string;
  tipMcp: string;
  tipTool: string;
  tipBug: string;
  
  // Navigation
  navMove: string;
  navSelect: string;
  navBack: string;
  navCancel: string;
  
  // Status messages
  setupComplete: string;
  readyMessage: string;
  providerDetected: string;
  noModelsAvailable: string;
  installModels: string;
  checkApiKey: string;
}

const translations: Record<SupportedLanguage, TranslationKeys> = {
  en: {
    welcomeTitle: '**Welcome to Enfiy Code!**',
    welcomeMessage: "I'm Enfiy's development assistant, designed to support AI-driven software development.",
    keyFeatures: '**Key Features:**',
    featureFileOps: 'Read, edit, and create files',
    featureCodeSearch: 'Search and analyze code',
    featureShellCommands: 'Execute shell commands',
    featureSuggestions: 'Provide development suggestions and code reviews',
    helpMessage: 'Feel free to ask if there\'s anything I can help you with!',
    
    providerSelectionTitle: 'AI Provider & Model Selection',
    selectCategoryPrompt: 'Please select your preferred AI category:',
    selectProviderPrompt: 'Please select an AI provider:',
    selectModelPrompt: 'Please select a model:',
    localAI: 'Local AI',
    cloudAI: 'Cloud AI',
    localAIDescription: 'Run AI models on your machine (private, fast, no API fees)',
    cloudAIDescription: 'Use cloud-based AI services (most powerful, API fees apply)',
    
    tipsTitle: 'Enfiy Code - Your Universal AI Coding Agent',
    tipProvider: 'Select AI provider and model',
    tipGeneral: 'Ask questions, edit files, run commands',
    tipSpecific: 'Be specific for better results',
    tipMemory: 'Customize interactions with ENFIY.md file',
    tipHelp: 'Show available commands',
    tipMcp: 'Connect to MCP servers for enhanced capabilities',
    tipTool: 'Access specialized tools and integrations',
    tipBug: 'Report bugs or issues',
    
    navMove: '↑↓ Move',
    navSelect: 'Enter Select',
    navBack: '← Back',
    navCancel: 'Esc Cancel',
    
    setupComplete: 'AI Provider setup complete:',
    readyMessage: 'Ready! Enter questions or commands. /help for help',
    providerDetected: 'Recommended AI:',
    noModelsAvailable: 'No models available for',
    installModels: 'Install models: ollama pull <model>',
    checkApiKey: 'Please check your API key.'
  },
  
  ja: {
    welcomeTitle: '**Enfiy Code へようこそ！**',
    welcomeMessage: '私はEnfiyの開発アシスタントです。AI駆動でソフトウェア開発をサポートします。',
    keyFeatures: '**主な機能:**',
    featureFileOps: 'ファイルの読み取り・編集・作成',
    featureCodeSearch: 'コードの検索・解析',
    featureShellCommands: 'シェルコマンドの実行',
    featureSuggestions: '開発の提案・コードレビュー',
    helpMessage: '何かお手伝いできることがあれば、お気軽にお尋ねください！',
    
    providerSelectionTitle: 'AIプロバイダー・モデル選択',
    selectCategoryPrompt: '希望するAIカテゴリーを選択してください:',
    selectProviderPrompt: 'AIプロバイダーを選択してください:',
    selectModelPrompt: 'モデルを選択してください:',
    localAI: 'ローカルAI',
    cloudAI: 'クラウドAI',
    localAIDescription: 'あなたのマシンでAIモデルを実行 (プライベート、高速、API料金なし)',
    cloudAIDescription: 'クラウドベースのAIサービスを利用 (最も強力、API料金が発生)',
    
    tipsTitle: 'Enfiy Code - AI駆動開発アシスタント',
    tipProvider: '/provider - AIプロバイダーとモデルを選択',
    tipGeneral: '質問、ファイル編集、コマンド実行が可能',
    tipSpecific: '具体的な指示でより良い結果を得られます',
    tipMemory: 'ENFIY.md ファイルで対話をカスタマイズ',
    tipHelp: '/help - 使用可能なコマンド一覧',
    tipMcp: '/mcp - MCPサーバーに接続して機能拡張',
    tipTool: '/tool - 専用ツールや統合機能にアクセス',
    tipBug: '/bug - バグや問題を報告',
    
    navMove: '↑↓ 移動',
    navSelect: 'Enter 選択',
    navBack: '← 戻る',
    navCancel: 'Esc キャンセル',
    
    setupComplete: '✓ 使用中:',
    readyMessage: '準備完了！質問やコマンドを入力してください。/help でヘルプを表示',
    providerDetected: '推奨AI:',
    noModelsAvailable: 'で利用可能なモデルがありません。',
    installModels: 'モデルをインストール: ollama pull <model>',
    checkApiKey: 'APIキーを確認してください。'
  },
  
  ko: {
    welcomeTitle: '🚀 **Enfiy Code에 오신 것을 환영합니다!**',
    welcomeMessage: '저는 AI 기반 소프트웨어 개발을 지원하도록 설계된 Enfiy의 개발 도우미입니다.',
    keyFeatures: '**주요 기능:**',
    featureFileOps: '📝 파일 읽기, 편집, 생성',
    featureCodeSearch: '🔍 코드 검색 및 분석',
    featureShellCommands: '🛠️ 셸 명령 실행',
    featureSuggestions: '💡 개발 제안 및 코드 리뷰 제공',
    helpMessage: '도움이 필요한 일이 있으시면 언제든지 말씀해 주세요!',
    
    providerSelectionTitle: 'AI 제공업체 및 모델 선택',
    selectCategoryPrompt: '원하는 AI 카테고리를 선택하세요:',
    selectProviderPrompt: 'AI 제공업체를 선택하세요:',
    selectModelPrompt: '모델을 선택하세요:',
    localAI: '로컬 AI',
    cloudAI: '클라우드 AI',
    localAIDescription: '컴퓨터에서 AI 모델 실행 (개인정보 보호, 빠름, API 요금 없음)',
    cloudAIDescription: '클라우드 기반 AI 서비스 사용 (가장 강력, API 요금 발생)',
    
    tipsTitle: '🚀 Enfiy Code - AI 기반 개발 도우미',
    tipProvider: '/provider - AI 제공업체 및 모델 선택',
    tipGeneral: '질문하기, 파일 편집, 명령 실행',
    tipSpecific: '더 나은 결과를 위해 구체적인 지시사항을 제공하세요',
    tipMemory: 'ENFIY.md 파일로 상호작용 사용자 정의',
    tipHelp: '/help - 사용 가능한 명령 표시',
    tipMcp: '/mcp - MCP 서버에 연결하여 기능 확장',
    tipTool: '/tool - 전용 도구 및 통합 기능에 액세스',
    tipBug: '/bug - 버그 또는 문제 신고',
    
    navMove: '↑↓ 이동',
    navSelect: 'Enter 선택',
    navBack: '← 뒤로',
    navCancel: 'Esc 취소',
    
    setupComplete: '🎯 AI 제공업체 설정 완료:',
    readyMessage: '✨ 준비 완료! 질문이나 명령을 입력하세요. 도움말은 /help',
    providerDetected: '🤖 권장 AI:',
    noModelsAvailable: '에 사용 가능한 모델이 없습니다.',
    installModels: '모델 설치: ollama pull <model>',
    checkApiKey: 'API 키를 확인하세요.'
  },
  
  es: {
    welcomeTitle: '🚀 **¡Bienvenido a Enfiy Code!**',
    welcomeMessage: 'Soy el asistente de desarrollo de Enfiy, diseñado para apoyar el desarrollo de software impulsado por IA.',
    keyFeatures: '**Características principales:**',
    featureFileOps: '📝 Leer, editar y crear archivos',
    featureCodeSearch: '🔍 Buscar y analizar código',
    featureShellCommands: '🛠️ Ejecutar comandos de shell',
    featureSuggestions: '💡 Proporcionar sugerencias de desarrollo y revisiones de código',
    helpMessage: '¡No dudes en preguntar si hay algo en lo que pueda ayudarte!',
    
    providerSelectionTitle: 'Selección de Proveedor y Modelo de IA',
    selectCategoryPrompt: 'Por favor, selecciona tu categoría de IA preferida:',
    selectProviderPrompt: 'Por favor, selecciona un proveedor de IA:',
    selectModelPrompt: 'Por favor, selecciona un modelo:',
    localAI: 'IA Local',
    cloudAI: 'IA en la Nube',
    localAIDescription: 'Ejecutar modelos de IA en tu máquina (privado, rápido, sin tarifas de API)',
    cloudAIDescription: 'Usar servicios de IA basados en la nube (más potente, se aplican tarifas de API)',
    
    tipsTitle: '🚀 Enfiy Code - Asistente de Desarrollo Impulsado por IA',
    tipProvider: '/provider - Seleccionar proveedor y modelo de IA',
    tipGeneral: 'Haz preguntas, edita archivos, ejecuta comandos',
    tipSpecific: 'Sé específico en tus instrucciones para mejores resultados',
    tipMemory: 'Personaliza las interacciones con el archivo ENFIY.md',
    tipHelp: '/help - Mostrar comandos disponibles',
    tipMcp: '/mcp - Conectar a servidores MCP para capacidades mejoradas',
    tipTool: '/tool - Acceder a herramientas especializadas e integraciones',
    tipBug: '/bug - Reportar errores o problemas',
    
    navMove: '↑↓ Mover',
    navSelect: 'Enter Seleccionar',
    navBack: '← Atrás',
    navCancel: 'Esc Cancelar',
    
    setupComplete: '🎯 Configuración del proveedor de IA completada:',
    readyMessage: '✨ ¡Listo! Introduce preguntas o comandos. /help para ayuda',
    providerDetected: '🤖 IA recomendada:',
    noModelsAvailable: 'No hay modelos disponibles para',
    installModels: 'Instalar modelos: ollama pull <model>',
    checkApiKey: 'Por favor, verifica tu clave API.'
  },
  
  fr: {
    welcomeTitle: '🚀 **Bienvenue dans Enfiy Code !**',
    welcomeMessage: 'Je suis l\'assistant de développement d\'Enfiy, conçu pour soutenir le développement logiciel piloté par l\'IA.',
    keyFeatures: '**Fonctionnalités principales :**',
    featureFileOps: '📝 Lire, éditer et créer des fichiers',
    featureCodeSearch: '🔍 Rechercher et analyser le code',
    featureShellCommands: '🛠️ Exécuter des commandes shell',
    featureSuggestions: '💡 Fournir des suggestions de développement et des révisions de code',
    helpMessage: 'N\'hésitez pas à demander s\'il y a quelque chose pour lequel je peux vous aider !',
    
    providerSelectionTitle: 'Sélection du Fournisseur et Modèle d\'IA',
    selectCategoryPrompt: 'Veuillez sélectionner votre catégorie d\'IA préférée :',
    selectProviderPrompt: 'Veuillez sélectionner un fournisseur d\'IA :',
    selectModelPrompt: 'Veuillez sélectionner un modèle :',
    localAI: 'IA Locale',
    cloudAI: 'IA Cloud',
    localAIDescription: 'Exécuter des modèles d\'IA sur votre machine (privé, rapide, pas de frais d\'API)',
    cloudAIDescription: 'Utiliser des services d\'IA basés sur le cloud (le plus puissant, frais d\'API applicables)',
    
    tipsTitle: '🚀 Enfiy Code - Assistant de Développement Piloté par l\'IA',
    tipProvider: '/provider - Sélectionner le fournisseur et le modèle d\'IA',
    tipGeneral: 'Posez des questions, éditez des fichiers, exécutez des commandes',
    tipSpecific: 'Soyez précis dans vos instructions pour de meilleurs résultats',
    tipMemory: 'Personnalisez les interactions avec le fichier ENFIY.md',
    tipHelp: '/help - Afficher les commandes disponibles',
    tipMcp: '/mcp - Se connecter aux serveurs MCP pour des capacités étendues',
    tipTool: '/tool - Accéder aux outils spécialisés et intégrations',
    tipBug: '/bug - Signaler des bugs ou des problèmes',
    
    navMove: '↑↓ Déplacer',
    navSelect: 'Entrée Sélectionner',
    navBack: '← Retour',
    navCancel: 'Échap Annuler',
    
    setupComplete: '🎯 Configuration du fournisseur d\'IA terminée :',
    readyMessage: '✨ Prêt ! Saisissez des questions ou des commandes. /help pour l\'aide',
    providerDetected: '🤖 IA recommandée :',
    noModelsAvailable: 'Aucun modèle disponible pour',
    installModels: 'Installer des modèles : ollama pull <model>',
    checkApiKey: 'Veuillez vérifier votre clé API.'
  },
  
  de: {
    welcomeTitle: '🚀 **Willkommen bei Enfiy Code!**',
    welcomeMessage: 'Ich bin Enfiy\'s Entwicklungsassistent, entwickelt zur Unterstützung KI-getriebener Softwareentwicklung.',
    keyFeatures: '**Hauptfunktionen:**',
    featureFileOps: '📝 Dateien lesen, bearbeiten und erstellen',
    featureCodeSearch: '🔍 Code suchen und analysieren',
    featureShellCommands: '🛠️ Shell-Befehle ausführen',
    featureSuggestions: '💡 Entwicklungsvorschläge und Code-Reviews bereitstellen',
    helpMessage: 'Zögern Sie nicht zu fragen, wenn es etwas gibt, womit ich Ihnen helfen kann!',
    
    providerSelectionTitle: 'KI-Anbieter & Modell-Auswahl',
    selectCategoryPrompt: 'Bitte wählen Sie Ihre bevorzugte KI-Kategorie:',
    selectProviderPrompt: 'Bitte wählen Sie einen KI-Anbieter:',
    selectModelPrompt: 'Bitte wählen Sie ein Modell:',
    localAI: 'Lokale KI',
    cloudAI: 'Cloud-KI',
    localAIDescription: 'KI-Modelle auf Ihrem Rechner ausführen (privat, schnell, keine API-Gebühren)',
    cloudAIDescription: 'Cloud-basierte KI-Dienste nutzen (am leistungsstärksten, API-Gebühren fallen an)',
    
    tipsTitle: '🚀 Enfiy Code - KI-getriebener Entwicklungsassistent',
    tipProvider: '/provider - KI-Anbieter und Modell auswählen',
    tipGeneral: 'Stellen Sie Fragen, bearbeiten Sie Dateien, führen Sie Befehle aus',
    tipSpecific: 'Seien Sie spezifisch in Ihren Anweisungen für bessere Ergebnisse',
    tipMemory: 'Interaktionen mit ENFIY.md-Datei anpassen',
    tipHelp: '/help - Verfügbare Befehle anzeigen',
    tipMcp: '/mcp - Mit MCP-Servern für erweiterte Funktionen verbinden',
    tipTool: '/tool - Auf spezialisierte Tools und Integrationen zugreifen',
    tipBug: '/bug - Bugs oder Probleme melden',
    
    navMove: '↑↓ Bewegen',
    navSelect: 'Eingabe Auswählen',
    navBack: '← Zurück',
    navCancel: 'Esc Abbrechen',
    
    setupComplete: '🎯 KI-Anbieter-Setup abgeschlossen:',
    readyMessage: '✨ Bereit! Geben Sie Fragen oder Befehle ein. /help für Hilfe',
    providerDetected: '🤖 Empfohlene KI:',
    noModelsAvailable: 'Keine Modelle verfügbar für',
    installModels: 'Modelle installieren: ollama pull <model>',
    checkApiKey: 'Bitte überprüfen Sie Ihren API-Schlüssel.'
  },
  
  ru: {
    welcomeTitle: '🚀 **Добро пожаловать в Enfiy Code!**',
    welcomeMessage: 'Я помощник разработчика Enfiy, созданный для поддержки разработки программного обеспечения на основе ИИ.',
    keyFeatures: '**Основные функции:**',
    featureFileOps: '📝 Чтение, редактирование и создание файлов',
    featureCodeSearch: '🔍 Поиск и анализ кода',
    featureShellCommands: '🛠️ Выполнение команд оболочки',
    featureSuggestions: '💡 Предоставление предложений по разработке и обзоров кода',
    helpMessage: 'Не стесняйтесь спрашивать, если есть что-то, с чем я могу помочь!',
    
    providerSelectionTitle: 'Выбор Провайдера и Модели ИИ',
    selectCategoryPrompt: 'Пожалуйста, выберите предпочтительную категорию ИИ:',
    selectProviderPrompt: 'Пожалуйста, выберите провайдера ИИ:',
    selectModelPrompt: 'Пожалуйста, выберите модель:',
    localAI: 'Локальный ИИ',
    cloudAI: 'Облачный ИИ',
    localAIDescription: 'Запуск моделей ИИ на вашей машине (приватно, быстро, без платы за API)',
    cloudAIDescription: 'Использование облачных сервисов ИИ (самые мощные, взимается плата за API)',
    
    tipsTitle: '🚀 Enfiy Code - Помощник Разработчика на Основе ИИ',
    tipProvider: '/provider - Выбрать провайдера и модель ИИ',
    tipGeneral: 'Задавайте вопросы, редактируйте файлы, выполняйте команды',
    tipSpecific: 'Будьте конкретны в своих инструкциях для лучших результатов',
    tipMemory: 'Настройте взаимодействия с файлом ENFIY.md',
    tipHelp: '/help - Показать доступные команды',
    tipMcp: '/mcp - Подключиться к серверам MCP для расширенных возможностей',
    tipTool: '/tool - Доступ к специализированным инструментам и интеграциям',
    tipBug: '/bug - Сообщить об ошибках или проблемах',
    
    navMove: '↑↓ Перемещение',
    navSelect: 'Enter Выбрать',
    navBack: '← Назад',
    navCancel: 'Esc Отмена',
    
    setupComplete: '🎯 Настройка провайдера ИИ завершена:',
    readyMessage: '✨ Готово! Введите вопросы или команды. /help для справки',
    providerDetected: '🤖 Рекомендуемый ИИ:',
    noModelsAvailable: 'Нет доступных моделей для',
    installModels: 'Установить модели: ollama pull <model>',
    checkApiKey: 'Пожалуйста, проверьте ваш API ключ.'
  }
};

// Current language state
let currentLanguage: SupportedLanguage | null = null;

// Language detection function
export function detectLanguage(): SupportedLanguage {
  // Return cached language if set
  if (currentLanguage) {
    return currentLanguage;
  }
  
  // Check environment variable first
  const envLang = process.env.ENFIY_LANG as SupportedLanguage;
  if (envLang && envLang in translations) {
    currentLanguage = envLang;
    return envLang;
  }
  
  // Check system locale
  const locale = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || 'en';
  const langCode = locale.split(/[._-]/)[0].toLowerCase() as SupportedLanguage;
  
  // Map to supported languages
  if (langCode in translations) {
    currentLanguage = langCode;
    return langCode;
  }
  
  // Default to English
  currentLanguage = 'en';
  return 'en';
}

// Main translation function
export function t(key: keyof TranslationKeys, lang?: SupportedLanguage): string {
  const language = lang || detectLanguage();
  return translations[language][key] || translations.en[key];
}

// Get current language
export function getCurrentLanguage(): SupportedLanguage {
  return detectLanguage();
}

// Get all supported languages
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(translations) as SupportedLanguage[];
}

// Set language manually
export function setLanguage(lang: SupportedLanguage): void {
  if (lang in translations) {
    currentLanguage = lang;
  }
}

// Get language display names
export function getLanguageDisplayNames(): Record<SupportedLanguage, string> {
  return {
    en: 'English',
    ja: '日本語',
    ko: '한국어', 
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ru: 'Русский'
  };
}