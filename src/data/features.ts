// Funktionen, wie sie auf /funktionen stehen und in /llms.txt (src/lib/llms.ts).
// Nach der README von Mietfuchs („Highlights“); nur, was das Programm wirklich kann.
export const FEATURE_GROUPS: { id: string; title: string; lead: string; items: { icon: string; title: string; text: string }[] }[] = [
  { id: 'abrechnen', title: 'Abrechnen', lead: 'Von der Rechnung bis zum fertigen Brief an jeden Mieter.', items: [
    { icon: 'calculator', title: 'Centgenaue Verteilung', text: 'Nach Wohnfläche, Personenzahl, Wohneinheiten, Verbrauch, direkt, nach vereinbarten Anteilen, laut Hausgeldabrechnung oder mit Einzelbeträgen. Rundungscent werden nachvollziehbar verteilt.' },
    { icon: 'file-text', title: 'Fertige Abrechnung je Mieter', text: 'Mit Saldo, Bescheinigung der haushaltsnahen Dienstleistungen nach § 35a EStG und Hinweisen zu den Fristen nach §§ 556 und 560 BGB. Den Rechenweg jeder Zeile können Sie aufklappen.' },
    { icon: 'calendar', title: 'Abrechnungszeitraum nach Wahl', text: 'Kalenderjahr oder ein anderer Zeitraum, etwa Mai bis April, mit Vorschau beim Wechsel.' },
    { icon: 'scale', title: 'Hinweise mit Rechtsgrundlage', text: 'Mietfuchs erklärt, was auffällt, etwa einen Rückstand, einen fehlenden Endstand beim Zählerwechsel oder eine Vorgabe der Heizkostenverordnung, und nennt die Rechtsgrundlage. Ein Lexikon erklärt die Fachbegriffe.' },
    { icon: 'receipt', title: 'Kosten aus dem Vorjahr übernehmen', text: 'Positionen samt Umlageschlüssel übernehmen und nur den neuen Betrag eintragen. Den Schlüssel merkt sich Mietfuchs je Kostenart.' }
  ] },
  { id: 'heizung', title: 'Heizung und Objekte', lead: 'Auch die schwierigen Fälle: Heizkosten, mehrere Häuser, Eigentumswohnungen.', items: [
    { icon: 'flame', title: 'Heizung und Warmwasser', text: 'Sie verteilen die Heizkosten selbst nach der Heizkostenverordnung, mit Wärmezählern oder den kleinen Verteilern an den Heizkörpern. Oder Sie übernehmen die fertige Abrechnung Ihres Messdienstes. Die CO₂-Kosten teilt Mietfuchs nach dem gesetzlichen Stufenmodell zwischen Mieter und Vermieter auf. Auch dabei: Brennstoff, der am Jahresende noch im Tank ist, mehrere Heizungen in einem Haus und Etagenheizungen.' },
    { icon: 'building', title: 'Mehrere Häuser und Eigentumswohnungen', text: 'Häuser und vermietete Eigentumswohnungen in einer Installation; jedes Objekt rechnet für sich. Kosten aus der Hausgeldabrechnung der Gemeinschaft übernehmen Sie mit ihrem Verteilerschlüssel.' },
    { icon: 'book-open', title: 'Anleitungen je Vermietungsart', text: 'Vom Haus mit Einliegerwohnung über die vermietete Eigentumswohnung bis zum Mieterwechsel mit Leerstand, je mit Schritten, Beispiel und Rechtslage.' },
    { icon: 'wallet', title: 'Mietkonto', text: 'Soll und Ist je Monat, fällige Rückstände auf einen Blick.' }
  ] },
  { id: 'belege', title: 'Belege, Steuer und Daten', lead: 'Alles an einem Ort, und alles bleibt bei Ihnen.', items: [
    { icon: 'folder', title: 'Belege an einem Ort', text: 'Im Eingang den ganzen Stapel ablegen, Rechnungen und Zählerfotos gemischt, prüfen und übernehmen. Im Ordner je Objekt, Jahr und Kostenart, mit Suche über alle Jahre, Belegmappe für Mieter als PDF und allen Belegen für die Steuer als ZIP.' },
    { icon: 'receipt', title: 'Übersicht für die Anlage V', text: 'Einnahmen nach Zufluss, Werbungskosten und Überschuss aufs Jahr. Wohnen Sie selbst im Haus, teilt Mietfuchs jede Position in abziehbar und privat auf.' },
    { icon: 'sparkles', title: 'Optionale KI-Belegauswertung', text: 'Rechnungen lassen sich auf Wunsch auslesen, mit Ollama auf dem eigenen Rechner oder mit einem Dienst Ihrer Wahl. Ohne KI funktioniert die Abrechnung vollständig.' },
    { icon: 'shield-check', title: 'Alles bleibt auf Ihrem Rechner', text: 'Keine Cloud, kein Konto, kein Tracking. Ihre Daten liegen in einem Ordner; eine Sicherung ist eine Kopie dieses Ordners. Ins Netz geht Mietfuchs nur für die Update-Prüfung, wenn Sie sie erlauben.' }
  ] },
]
