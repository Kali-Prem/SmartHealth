import { Language } from '../types';

export const translations = {
  en: {
    appTitle: 'SmartHealth',
    subtitle: 'District Health Command Center (PHC/CHC Network)',
    district: 'Pune District',
    state: 'Maharashtra',
    dashboard: 'Dashboard & Overview',
    facilities: 'Health Facilities (12)',
    inventory: 'Medicine Stock & Redistribution',
    operations: 'Daily Operations & Attendance',
    copilot: 'Gemini AI Health Advisor',

    // High Contrast & Accessibility
    highContrast: 'High Contrast Mode',
    voiceInput: 'Voice Input',
    listening: 'Listening... (Speak in English, Hindi, or Marathi)',

    // Planted Problems Warnings
    alertsTitle: 'Critical Operational Alerts & Deficits Flagged',
    chronicStockout: 'Chronic Medicine Stockout',
    highDoctorAbsence: 'High Doctor Absenteeism',
    facilityOverloaded: 'Facility Overloaded (Capacity Exceeded)',
    interveneAction: 'Recommend Interventions',

    // KPIs
    dailyFootfall: 'Daily Patient Footfall',
    doctorAttendance: 'Doctor Attendance Rate',
    bedSaturation: 'Inpatient Bed Saturation',
    testReadiness: 'Diagnostic Test Readiness',
    vulnerableCentres: 'Deficit Centres Flagged',

    // Inventory
    searchMedicine: 'Search medicines (e.g. Paracetamol, Snake Antivenom, Rabies)...',
    allCategories: 'All Categories',
    antibiotics: 'Antibiotics',
    analgesics: 'Analgesics',
    antidotes: 'Antivenom & Antidotes',
    vaccines: 'Vaccines',
    maternalHealth: 'Maternal Health',
    stockStatus: 'Stock Status',
    stockout: 'Stockout (0)',
    lowStock: 'Low Stock (< Reorder)',
    normalStock: 'Adequate Stock',
    lateralRebalance: 'Lateral Stock Rebalance',
    transferSuccess: 'Inter-facility transfer request generated successfully',

    // Facilities
    filterByBlock: 'Filter by Block',
    allBlocks: 'All Blocks',
    allTypes: 'All Types (PHC & CHC)',
    inCharge: 'Medical Officer In-Charge',
    beds: 'Beds',
    doctors: 'Doctors',
    viewDetails: 'Facility Profile',

    // Operations
    patientFootfallTrend: '90-Day Footfall Trend',
    doctorRoster: 'Doctor Shift Attendance Punch Ledger',
    labTestAudits: 'Diagnostic Kit Availability & Equipment Health',
    emergencyVisits: 'Casualty / Emergency Visits',
    waitTime: 'Avg Wait Time',
    minutes: 'mins',

    // AI Copilot
    askCopilot: 'Ask District AI Copilot...',
    suggestedQueries: 'Quick Administrative Inquiries:',
    queryStockout: 'Show me all PHCs with zero antivenom and generate redistribution plan',
    queryAttendance: 'Which facilities have doctor absenteeism over 50% this week?',
    queryFootfall: 'Analyze the OPD surge at Wagholi PHC and recommend load balancing',
    send: 'Send Inquiry',
    clear: 'Clear',

    // Milestone 2: District Map & Haversine Redistribution
    districtMap: 'District Map (Google Maps)',
    mapView: 'District Map',
    rebalanceModalTitle: 'Haversine Lateral Stock Redistribution Optimizer',
    geminiExplanationTitle: 'Gemini AI Clinical & Logistical Justification',
    haversineDistance: 'Haversine Great-Circle Distance',
    estimatedTransit: 'Estimated Transit Time',
    recommendedTransfer: 'Recommended Transfer Quantity',
    donorRemaining: 'Donor Retained Reserve Stock',
    executeTransfer: 'Confirm & Dispatch Lateral Transfer',
    executing: 'Dispatching...',
    transferDone: 'Transfer Executed Successfully',
    closestDonor: 'Optimal Nearest Donor Facility',

    // Milestone 3: Forecasting, Early Warnings & Staff Deputations
    demandForecast: 'AI Demand Forecasting & Warnings',
    earlyWarnings: 'Early Stockout Warning Radar',
    daysRemaining: 'Days Supply Remaining',
    burnRate: 'Daily Burn Rate',
    predictedDemand: 'Predicted 30-Day Demand',
    recommendedProcurement: 'Advance Indent',
    deputationModalTitle: 'Smart Doctor Deputation Optimizer',
    executeDeputation: 'Confirm & Issue Deputation Order',
    deputationSuccess: 'Doctor deputation order issued successfully',
    voiceAssistant: 'Voice Assistant',
    startListening: 'Start Voice Input',
    stopListening: 'Stop Voice Input',
    deputationRecommendations: 'Recommended Emergency Doctor Deputations',
    solveAbsenteeism: 'Redistribute On-Duty Doctors',
    demoMode: 'Interactive Demo Mode',
  },
  hi: {
    appTitle: 'स्मार्टहेल्थ',
    subtitle: 'जिला स्वास्थ्य नियंत्रण केंद्र (प्रा.आ.के./सा.आ.के. नेटवर्क)',
    district: 'पुणे जिला',
    state: 'महाराष्ट्र',
    dashboard: 'डैशबोर्ड और समीक्षा',
    facilities: 'स्वास्थ्य केंद्र (12)',
    inventory: 'दवा भंडार एवं पुनर्वितरण',
    operations: 'दैनिक संचालन एवं उपस्थिति',
    copilot: 'जेमिनी एआई स्वास्थ्य सलाहकार',

    // High Contrast & Accessibility
    highContrast: 'उच्च कंट्रास्ट मोड',
    voiceInput: 'आवाज इनपुट (बोलें)',
    listening: 'सुन रहा है... (हिंदी, अंग्रेजी या मराठी में बोलें)',

    // Planted Problems Warnings
    alertsTitle: 'गंभीर परिचालन चेतावनियाँ और कमी की सूचना',
    chronicStockout: 'दवाओं का गंभीर अभाव (स्टॉकआउट)',
    highDoctorAbsence: 'डॉक्टरों की अत्यधिक अनुपस्थिति',
    facilityOverloaded: 'केंद्र अतिभारित (क्षमता से अधिक मरीज)',
    interveneAction: 'उपचारात्मक सुझाव देखें',

    // KPIs
    dailyFootfall: 'दैनिक मरीज उपस्थिति (OPD)',
    doctorAttendance: 'डॉक्टर उपस्थिति दर',
    bedSaturation: 'अस्पताल बेड अधिभोग (संतृप्ति)',
    testReadiness: 'नैदानिक जाँच उपलब्धता',
    vulnerableCentres: 'कमी वाले चिह्नित केंद्र',

    // Inventory
    searchMedicine: 'दवा खोजें (जैसे: पैरासिटामोल, सर्पदंश विषरोधी, रेबीज)...',
    allCategories: 'सभी श्रेणियां',
    antibiotics: 'एंटीबायोटिक्स',
    analgesics: 'दर्द निवारक',
    antidotes: 'एंटीवेनम और मारक',
    vaccines: 'टीके (वैक्सीन)',
    maternalHealth: 'मातृ स्वास्थ्य',
    stockStatus: 'स्टॉक स्थिति',
    stockout: 'स्टॉक शून्य (0)',
    lowStock: 'कम स्टॉक (< पुनः ऑर्डर)',
    normalStock: 'पर्याप्त स्टॉक',
    lateralRebalance: 'पार्श्व स्टॉक पुनर्वितरण',
    transferSuccess: 'अंतर-केंद्र दवा स्थानांतरण अनुरोध सफलतापूर्वक तैयार किया गया',

    // Facilities
    filterByBlock: 'तालुका (ब्लॉक) द्वारा फ़िल्टर',
    allBlocks: 'सभी ब्लॉक',
    allTypes: 'सभी प्रकार (PHC एवं CHC)',
    inCharge: 'प्रभारी चिकित्सा अधिकारी',
    beds: 'बिस्तर',
    doctors: 'चिकित्सक',
    viewDetails: 'केंद्र विवरण',

    // Operations
    patientFootfallTrend: '90-दिवसीय मरीज आवक रुझान',
    doctorRoster: 'डॉक्टर शिफ्ट उपस्थिति पंजी',
    labTestAudits: 'जांच किट उपलब्धता एवं उपकरण स्थिति',
    emergencyVisits: 'आपातकालीन / दुर्घटना आगमन',
    waitTime: 'औसत प्रतीक्षा समय',
    minutes: 'मिनट',

    // AI Copilot
    askCopilot: 'जिला एआई सहायक से पूछें...',
    suggestedQueries: 'त्वरित प्रशासनिक प्रश्न:',
    queryStockout: 'शून्य एंटीवेनम वाले प्राथमिक केंद्रों और पुनर्वितरण योजना की जानकारी दें',
    queryAttendance: 'इस सप्ताह 50% से अधिक डॉक्टर अनुपस्थिति वाले केंद्रों की सूची दें',
    queryFootfall: 'वाघोली केंद्र पर अत्यधिक मरीज भार का विश्लेषण और भार संतुलन सुझाव दें',
    send: 'पूछें',
    clear: 'साफ़ करें',

    // Milestone 2: District Map & Haversine Redistribution
    districtMap: 'जिला मानचित्र (गूगल मैप्स)',
    mapView: 'जिला मानचित्र',
    rebalanceModalTitle: 'हैवरसाइन पार्श्व स्टॉक पुनर्वितरण अनुकूलक',
    geminiExplanationTitle: 'जेमिनी एआई चिकित्सीय एवं तार्किक औचित्य',
    haversineDistance: 'हैवरसाइन दूरी (ग्रेट-सर्कल)',
    estimatedTransit: 'अनुमानित परिवहन समय',
    recommendedTransfer: 'अनुशंसित स्थानांतरण मात्रा',
    donorRemaining: 'दाता केंद्र आरक्षित शेष स्टॉक',
    executeTransfer: 'पुष्टि करें और पार्श्व स्थानांतरण भेजें',
    executing: 'प्रेषण जारी...',
    transferDone: 'स्थानांतरण सफलतापूर्वक निष्पादित',
    closestDonor: 'सर्वोत्तम निकटतम दाता केंद्र',

    // Milestone 3: Forecasting, Early Warnings & Staff Deputations
    demandForecast: 'एआई मांग पूर्वानुमान एवं चेतावनी',
    earlyWarnings: 'प्रारंभिक स्टॉकआउट चेतावनी रडार',
    daysRemaining: 'शेष आपूर्ति दिवस',
    burnRate: 'दैनिक उपभोग दर',
    predictedDemand: 'अनुमानित ३०-दिवसीय मांग',
    recommendedProcurement: 'अग्रिम मांगपत्र',
    deputationModalTitle: 'स्मार्ट डॉक्टर प्रतिनियुक्ति अनुकूलक',
    executeDeputation: 'पुष्टि करें और प्रतिनियुक्ति आदेश जारी करें',
    deputationSuccess: 'डॉक्टर प्रतिनियुक्ति आदेश सफलतापूर्वक जारी किया गया',
    voiceAssistant: 'ध्वनि सहायक',
    startListening: 'बोलना शुरू करें',
    stopListening: 'बोलना बंद करें',
    deputationRecommendations: 'अनुशंसित आपातकालीन डॉक्टर प्रतिनियुक्ति',
    solveAbsenteeism: 'उपस्थित डॉक्टरों का पुनर्वितरण करें',
    demoMode: 'इंटरएक्टिव डेमो मोड',
  },
  mr: {
    appTitle: 'SmartHealth',
    subtitle: 'जिल्हा आरोग्य नियंत्रण केंद्र (प्रा.आ.के./सा.आ.के. नेटवर्क)',
    district: 'पुणे जिल्हा',
    state: 'महाराष्ट्र',
    dashboard: 'नियंत्रण कक्ष आणि विहंगावलोकन',
    facilities: 'आरोग्य केंद्रे (१२)',
    inventory: 'औषध साठा आणि पुनर्वितरण',
    operations: 'दैनंदिन कामकाज आणि उपस्थिती',
    copilot: 'जेमिनी एआय आरोग्य सल्लागार',

    // High Contrast & Accessibility
    highContrast: 'उच्च कॉन्ट्रास्ट मोड',
    voiceInput: 'व्हॉइस इनपुट',
    listening: 'ऐकत आहे... (मराठी, हिंदी किंवा इंग्रजीत बोला)',

    // Planted Problems Warnings
    alertsTitle: 'गंभीर ऑपरेशनल इशारे आणि त्रुटी',
    chronicStockout: 'दीर्घकालीन औषध तुटवडा',
    highDoctorAbsence: 'डॉक्टरांची उच्च अनुपस्थिती',
    facilityOverloaded: 'केंद्रावर अतिरिक्त भार (क्षमता ओलांडली)',
    interveneAction: 'हस्तक्षेप शिफारसी',

    // KPIs
    dailyFootfall: 'दैनंदिन रुग्ण संख्या',
    doctorAttendance: 'डॉक्टर उपस्थिती प्रमाण',
    bedSaturation: 'खाट उपलब्धता प्रमाण',
    testReadiness: 'निदान चाचणी सज्जता',
    vulnerableCentres: 'त्रुटी असलेली केंद्रे',

    // Inventory
    searchMedicine: 'औषधे शोधा (उदा. पॅरासिटामॉल, सर्पदंश लस, रेबीज)...',
    allCategories: 'सर्व श्रेणी',
    antibiotics: 'प्रतिजैविके (Antibiotics)',
    analgesics: 'वेदनानाशक (Analgesics)',
    antidotes: 'विषरोधक लस (Antivenom)',
    vaccines: 'लसी (Vaccines)',
    maternalHealth: 'मातृ आरोग्य',
    stockStatus: 'साठा स्थिती',
    stockout: 'साठा संपला (०)',
    lowStock: 'कमी साठा (< पुनर्मागणी)',
    normalStock: 'पुरेसा साठा',
    lateralRebalance: 'केंद्रांमधील औषध पुनर्वितरण',
    transferSuccess: 'औषध हस्तांतरण आदेश यशस्वीरित्या जारी केला',

    // Facilities
    filterByBlock: 'तालुक्यानुसार निवडा',
    allBlocks: 'सर्व तालुके',
    allTypes: 'सर्व प्रकार (प्रा.आ.के. व सा.आ.के.)',
    inCharge: 'वैद्यकीय अधिकारी प्रभारी',
    beds: 'खाटांची स्थिती',
    doctors: 'वैद्यकीय अधिकारी',
    viewDetails: 'केंद्राचे तपशील',

    // Operations
    patientFootfallTrend: '९०-दिवसीय रुग्ण संख्या कल',
    doctorRoster: 'डॉक्टर हजेरी पत्रक आणि शिफ्ट नोंद',
    labTestAudits: 'निदान चाचणी किट उपलब्धता आणि उपकरण आरोग्य',
    emergencyVisits: 'तातडीचे / अपघात रुग्ण विभाग',
    waitTime: 'सरासरी प्रतीक्षा वेळ',
    minutes: 'मिनिटे',

    // AI Copilot
    askCopilot: 'जिल्हा जेमिनी एआय सल्लागाराला विचारा...',
    suggestedQueries: 'त्वरित प्रशासकीय प्रश्न:',
    queryStockout: 'शून्य सर्पदंश लस असलेली केंद्रे दाखवा आणि पुनर्वितरण योजना तयार करा',
    queryAttendance: 'या आठवड्यात ५०% पेक्षा जास्त डॉक्टर गैरहजर असलेली केंद्रे कोणती?',
    queryFootfall: 'वाघोली केंद्रावरील गर्दीचे विश्लेषण करा आणि भार संतुलन शिफारस करा',
    send: 'विचारा',
    clear: 'साफ करा',

    // Milestone 2: District Map & Haversine Redistribution
    districtMap: 'जिल्हा नकाशा (Google Maps)',
    mapView: 'जिल्हा नकाशा',
    rebalanceModalTitle: 'हॅवरसाइन औषध साठा पुनर्वितरण ऑप्टिमायझर',
    geminiExplanationTitle: 'जेमिनी एआय वैद्यकीय आणि तार्किक समर्थन',
    haversineDistance: 'हॅवरसाइन अंतर (ग्रेट-सर्कल)',
    estimatedTransit: 'अंदाजे वाहतूक वेळ',
    recommendedTransfer: 'शिफारस केलेले हस्तांतरण प्रमाण',
    donorRemaining: 'देणाऱ्या केंद्राकडील राखीव साठा',
    executeTransfer: 'पुष्टी करा आणि साठा हस्तांतरण रवाना करा',
    executing: 'रवाना होत आहे...',
    transferDone: 'हस्तांतरण यशस्वीरित्या पूर्ण झाले',
    closestDonor: 'सर्वोत्तम जवळचे देणारे केंद्र',

    // Milestone 3: Forecasting, Early Warnings & Staff Deputations
    demandForecast: 'एआय मागणी अंदाज व पूर्वसूचना',
    earlyWarnings: 'साठा संपण्याचा काउंटडाउन रडार',
    daysRemaining: 'उर्वरित पुरवठा दिवस',
    burnRate: 'दैनिक वापर दर',
    predictedDemand: 'अनुमानित ३०-दिवसांची मागणी',
    recommendedProcurement: 'अग्रिम मागणीपत्र (Indent)',
    deputationModalTitle: 'स्मार्ट डॉक्टर प्रतिनियुक्ती सहायक',
    executeDeputation: 'पुष्टी करा आणि प्रतिनियुक्ती आदेश जारी करा',
    deputationSuccess: 'डॉक्टर प्रतिनियुक्ती आदेश यशस्वीरित्या जारी केला',
    voiceAssistant: 'व्हॉइस सहाय्यक',
    startListening: 'बोलणे सुरू करा',
    stopListening: 'बोलणे थांबवा',
    deputationRecommendations: 'तातडीच्या डॉक्टर प्रतिनियुक्ती शिफारसी',
    solveAbsenteeism: 'उपस्थित डॉक्टरांचे पुनर्वितरण करा',
    demoMode: 'परस्परसंवादी डेमो मोड',
  },
};

export type TranslationKey = keyof typeof translations.en;
export type TranslationDict = Record<TranslationKey, string>;

export const useTranslation = (lang: Language): TranslationDict => {
  return (translations[lang] || translations.en) as TranslationDict;
};
