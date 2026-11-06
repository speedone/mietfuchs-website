// Funktionen, wie sie auf /funktionen stehen und in /llms.txt (src/lib/llms.ts). Nur, was das Programm
// wirklich kann: Quelle sind README und CHANGELOG von Mietfuchs, jeder Punkt am Code nachgesehen.
// `brands`: Systemlogos statt des Lucide-Symbols, nur wo die Karte Systeme nennt (src/components/BrandIcon.astro).
export type Feature = { icon: string; title: string; text: string; id?: string; brands?: ('windows' | 'apple' | 'linux' | 'docker')[] }
export type FeatureGroup = { id: string; title: string; lead: string; items: Feature[] }

export const FEATURE_GROUPS: FeatureGroup[] = [
  { id: 'abrechnen', title: 'Abrechnen', lead: 'Von der Rechnung bis zum fertigen Brief an jeden Mieter.', items: [
    { icon: 'calculator', title: 'Centgenaue Verteilung', text: 'Nach Wohnfläche, Personenzahl, Wohneinheiten, Verbrauch, direkt, nach vereinbarten Anteilen, laut Hausgeldabrechnung oder mit Einzelbeträgen. Rundungscent werden nachvollziehbar verteilt.' },
    { icon: 'gauge', id: 'zaehler', title: 'Haupt- und Zwischenzähler', text: 'Bei Kosten nach Verbrauch wählen Sie, von welchem Zähler der Allgemeinverbrauch abgezogen wird (voreingestellt der Hauptzähler), und wie der Rest verteilt wird: im Verhältnis der Zähler oder nach Fläche, Personen oder Einheiten, auch nur für bestimmte Wohnungen. Zwischenzähler legen Sie dem Vermieter, einer Wohnung oder einer Gruppe von Wohnungen zu, ein Zähler für einen Teil des Hauses ist möglich. Liegt der Rest bei ganz gemessenen Wohnungen über 20 % des Bezugsverbrauchs, warnt Mietfuchs.' },
    { icon: 'clipboard-check', id: 'geschaetzte-ablesung', title: 'Geschätzte Ablesung', text: 'Konnten Sie einen Stand nicht ablesen, markieren Sie ihn als geschätzt und halten die Begründung fest. Sie steht in der Abrechnung beim Verbrauch des Mieters. Bei der eigenen Heizkostenabrechnung warnt Mietfuchs, wenn geschätzte Ablesungen mehr als 25 % der Fläche betreffen (§ 9a Abs. 2 HeizkostenV).' },
    { icon: 'file-text', title: 'Fertige Abrechnung je Mieter', text: 'Mit Saldo, Bescheinigung der haushaltsnahen Dienstleistungen nach § 35a EStG und Hinweisen zu den Fristen nach §§ 556 und 560 BGB. Den Rechenweg jeder Zeile können Sie aufklappen.' },
    { icon: 'mail', title: 'Anschreiben und Briefpapier', text: 'Auf Seite 1 steht ein Brief nach DIN 5008 mit Ihrer Anschrift und der Anrede je Mieter, auf Wunsch mit Ihrem Logo oder eigenem Briefpapier. Jede Seite trägt unten Objekt und Wohnung, damit lose Blätter zuzuordnen sind.' },
    { icon: 'trending-up', title: 'Neue Vorauszahlung', text: 'Je Mieter wählen Sie nach § 560 Abs. 4 BGB: keine Anpassung, den Vorschlag von Mietfuchs oder einen eigenen Betrag. Liegt er über dem Vorschlag, weist Mietfuchs auf die angemessene Höhe hin.' },
    { icon: 'calendar', title: 'Abrechnungszeitraum und Fristen', text: 'Kalenderjahr oder ein anderer Zeitraum, etwa Mai bis April, mit Vorschau beim Wechsel. Fristen rechnet Mietfuchs mit den Feiertagen des Bundeslands, in dem das Objekt liegt.' },
    { icon: 'scale', title: 'Hinweise mit Rechtsgrundlage', text: 'Mietfuchs erklärt, was auffällt, etwa einen Rückstand, einen fehlenden Endstand beim Zählerwechsel, Wasser nach Personen oder Fläche trotz Zählern in allen genutzten Wohnungen (§ 556a BGB) oder eine Vorgabe der Heizkostenverordnung, und nennt die Rechtsgrundlage. Darf ein Mieter kürzen, steht der Betrag dabei. Ein Lexikon erklärt die Fachbegriffe.' },
    { icon: 'eye', title: 'Kontrolle vor dem Versand', text: 'Eine Kontrollansicht zeigt je Kostenposition alle Mieter nebeneinander und die Summe gegen den Rechnungsbetrag. Die Zahlen der Abrechnung lassen sich als CSV oder JSON exportieren.' },
    { icon: 'send', id: 'versand', title: 'Abschluss und Versand', text: 'Erst schließen Sie die Abrechnung ab, danach halten Sie mit „Als versendet markieren“ das Versanddatum fest, voreingestellt heute. Mietfuchs nimmt kein Datum nach heute und keins vor dem Ende des Abrechnungszeitraums an und fragt nach, bevor sich ein gespeichertes Datum ändert, denn an diesem Tag hängt die Frist nach § 556 Abs. 3 BGB.' },
    { icon: 'receipt', title: 'Kosten aus dem Vorjahr übernehmen', text: 'Positionen samt Umlageschlüssel übernehmen und nur den neuen Betrag eintragen. Den Schlüssel merkt sich Mietfuchs je Kostenart.' },
  ] },
  { id: 'vermietung', title: 'So, wie Sie vermieten', lead: 'Vom Haus mit Einliegerwohnung bis zu mehreren Häusern, Eigentumswohnungen und WG-Zimmern.', items: [
    { icon: 'building', id: 'mehrere-objekte', title: 'Mehrere Häuser und Eigentumswohnungen', text: 'Häuser und vermietete Eigentumswohnungen in einer Installation; jedes Objekt rechnet für sich. Mehrere Gebäude, die gemeinsam abrechnen, legen Sie als ein Objekt an. Kosten aus der Hausgeldabrechnung der Gemeinschaft übernehmen Sie mit ihrem Verteilerschlüssel.' },
    { icon: 'door-open', id: 'wg-zimmer', title: 'Zimmer einer Wohnung (WG)', text: 'Vermieten Sie die Zimmer einer Wohnung einzeln: Sie legen die Wohnung an und jedes Zimmer als eigene Einheit mit eigenem Mietverhältnis. Die Zimmer zählen mit ihrem Anteil der Wohnfläche, die ganze Wohnung mit Küche, Bad und Flur genau einmal. Der Zähler der Wohnung geht nach Fläche oder Personentagen auf die Zimmer. Mietfuchs warnt bei Kosten, die nur die WG betreffen, etwa Strom oder Internet, denn sie sind keine Betriebskosten.' },
    { icon: 'users', id: 'mieterwechsel', title: 'Mieterwechsel, Leerstand, Selbstnutzung', text: 'Ein- und Auszug mitten im Jahr werden tagesgenau berücksichtigt, den Leerstand trägt der Vermieter. Wohnen Sie selbst im Haus oder wird eine Wohnung im Jahr anders genutzt, rechnet Mietfuchs Ihren Anteil getrennt.' },
    { icon: 'key-round', id: 'pauschale', title: 'Pauschale und Warmmiete', text: 'Zahlt ein Mieter eine Pauschale oder ist die Heizung in der Miete enthalten, bekommt er keine Abrechnung, und sein Anteil bleibt beim Vermieter. Wo die Heizkostenverordnung etwas anderes verlangt, weist Mietfuchs darauf hin.' },
    { icon: 'circle-slash', title: 'Nicht vereinbarte Kosten', text: 'Steht eine Kostenart nicht im Mietvertrag, tragen Sie den Anteil dieses Mieters selbst. Die übrigen Mieter zahlen dadurch nie mehr.' },
    { icon: 'book-open', title: 'Anleitungen je Vermietungsart', text: 'Vom Haus mit Einliegerwohnung über die vermietete Eigentumswohnung bis zum Mieterwechsel mit Leerstand, je mit Schritten, Beispiel und Rechtslage.' },
  ] },
  { id: 'heizung', title: 'Heizung und Warmwasser', lead: 'Die Heizkostenabrechnung selbst erstellen oder die des Messdienstes übernehmen.', items: [
    { icon: 'flame', title: 'Heizkosten nach HeizkostenV', text: 'Sie verteilen die Heizkosten selbst nach der Heizkostenverordnung, mit Wärmezählern oder den kleinen Verteilern an den Heizkörpern. Oder Sie übernehmen die fertige Abrechnung Ihres Messdienstes. Die CO₂-Kosten teilt Mietfuchs nach dem gesetzlichen Stufenmodell zwischen Mieter und Vermieter auf.' },
    { icon: 'calendar-check', title: 'Monatliche Verbrauchsinformation', text: 'Für die Mitteilung nach § 6a HeizkostenV halten Sie je Monat den Stand und einen Vergleichswert fest; Mietfuchs druckt das Blatt je Mieter.' },
    { icon: 'thermometer', title: 'Auch die Sonderfälle', text: 'Brennstoff, der am Jahresende noch im Tank ist, mehrere Heizungen in einem Haus, Etagenheizungen, Wärme im Contracting, Betriebsstrom der Heizung, Grundkosten nach umbautem Raum und Leerstand nach Gradtagen.' },
    { icon: 'printer', title: 'Ableseformular', text: 'Ein Blatt mit allen Zählern des Objekts, je Zähler mit Nummer und letztem Stand, und leeren Feldern für die neue Ablesung.' },
  ] },
  { id: 'belege', title: 'Belege, Steuer und Mietkonto', lead: 'Alles an einem Ort, vom Beleg bis zur Anlage V.', items: [
    { icon: 'folder', title: 'Belege an einem Ort', text: 'Im Eingang den ganzen Stapel ablegen, Rechnungen und Zählerfotos gemischt, prüfen und übernehmen. Im Ordner je Objekt, Jahr und Kostenart, mit Suche über alle Jahre, Belegmappe für Mieter als PDF und allen Belegen für die Steuer als ZIP.' },
    { icon: 'sparkles', title: 'Optionale KI-Belegauswertung', text: 'Rechnungen lassen sich auf Wunsch auslesen, mit Ollama auf dem eigenen Rechner oder mit einem Dienst Ihrer Wahl. Ohne KI funktioniert die Abrechnung vollständig.' },
    { icon: 'landmark', title: 'Übersicht für die Anlage V', text: 'Einnahmen nach Zufluss und nach Zeilen der Anlage V, Werbungskosten und Überschuss aufs Jahr, mit mehreren Objekten auch zusammen. Wohnen Sie selbst im Haus, teilt Mietfuchs jede Position in abziehbar und privat auf.' },
    { icon: 'piggy-bank', title: 'Steuerliche Sonderfälle', text: 'Größeren Erhaltungsaufwand auf zwei bis fünf Jahre verteilen (§ 82b EStDV), verbilligte Vermietung etwa an Angehörige (§ 21 Abs. 2 EStG) und die Entnahme aus der Erhaltungsrücklage einer Eigentumswohnung.' },
    { icon: 'wallet', title: 'Mietkonto', text: 'Soll und Ist je Monat, fällige Rückstände auf einen Blick.' },
  ] },
  { id: 'daten', title: 'Ihre Daten', lead: 'Alles bleibt bei Ihnen, und nichts geht verloren.', items: [
    { icon: 'shield-check', title: 'Alles bleibt auf Ihrem Rechner', text: 'Keine Cloud, kein Konto, kein Tracking. Ihre Daten liegen in einem Ordner; eine Sicherung ist eine Kopie dieses Ordners. Ins Netz geht Mietfuchs nur für die Update-Prüfung, wenn Sie sie erlauben, und für die KI-Belegauswertung, wenn Sie dafür einen Dienst im Internet einrichten.' },
    { icon: 'history', title: 'Verlauf und Rückgängig', text: 'Jede Änderung steht mit Zeitpunkt im Verlauf, aufgeklappt mit altem und neuem Wert. Ein Schritt lässt sich rückgängig machen; gelöschte Belege liegen zwölf Monate im Papierkorb.' },
    { icon: 'app-window', brands: ['windows', 'apple'], id: 'programm', title: 'Eigenes Programm für Windows und macOS', text: 'Mit eigenem Fenster und Symbol in Taskleiste oder Dock, aus dem Microsoft Store, mit dem Installer oder als Abbild für den Mac. Die Abrechnung druckt überall gleich, mit Briefpapier und „Seite x von y“, auch auf dem Mac. Unter Linux, auf dem Raspberry Pi und in Docker läuft Mietfuchs im Browser.' },
    { icon: 'smartphone', id: 'heimnetz', title: 'Vom Handy aus dem Heimnetz', text: 'Auf Wunsch öffnen Sie Mietfuchs auch im Browser von Handy, Tablet oder einem zweiten Rechner im selben WLAN. Das erlauben Sie in den Einstellungen; ohne diese Erlaubnis ist das Programm nur auf Ihrem Rechner erreichbar.' },
    { icon: 'archive-restore', title: 'Automatische Vorversionen', text: 'Einmal die Woche legt Mietfuchs eine Kopie Ihrer Daten an und behält die letzten vier. Haben Sie versehentlich etwas gelöscht, kehren Sie zu einer davon zurück.' },
  ] },
]

// Die sechs Kacheln der Startseite: was Lust macht und nicht schon ein eigener Abschnitt zeigt
// (Rechenweg, Prüfung vor dem Versand und „lokal“ stehen dort schon).
export const HOME_FEATURES: Feature[] = [
  { icon: 'flame', title: 'Heizkosten selbst abrechnen', text: 'Nach der Heizkostenverordnung mit Ihren Zählern oder Verteilern, CO₂-Aufteilung nach dem Stufenmodell inklusive. Oder Sie übernehmen die Abrechnung des Messdienstes.' },
  { icon: 'mail', title: 'Fertiger Brief für jeden Mieter', text: 'Anschreiben nach DIN 5008, auf Wunsch mit Ihrem Logo, die neue Vorauszahlung und die Bescheinigung nach § 35a EStG. Ausdrucken und abschicken.' },
  { icon: 'scan-text', title: 'Belege ablegen statt abtippen', text: 'Den ganzen Stapel in den Eingang legen. Auf Wunsch liest eine KI die Rechnungen aus, auch nur auf Ihrem Rechner. Für die Belegeinsicht gibt es eine Mappe als PDF.' },
  { icon: 'landmark', title: 'Die Steuer gleich mit', text: 'Aus denselben Zahlen entsteht die Übersicht für die Anlage V, nach Zeilen geordnet. Wohnen Sie selbst im Haus, trennt Mietfuchs abziehbar und privat.' },
  { icon: 'building', title: 'So, wie Sie vermieten', text: 'Mehrere Häuser, Eigentumswohnungen mit Hausgeldabrechnung, WG-Zimmer, Mieterwechsel mitten im Jahr, Pauschale oder Warmmiete. Für die häufigen Fälle gibt es eine Anleitung.' },
  { icon: 'history', title: 'Nichts geht verloren', text: 'Jede Änderung steht im Verlauf und lässt sich rückgängig machen. Einmal die Woche legt Mietfuchs selbst eine Sicherung an.' },
]

// Die Anwendungsfälle unter der Überschrift der Startseite: Wer seine Vermietung darin wiederfindet, weiß
// sofort, dass Mietfuchs passt. Jeder Eintrag führt zur passenden Funktion oder zum Ratgeber.
export const USE_CASES: { label: string; href: string }[] = [
  { label: 'Einliegerwohnung im eigenen Haus', href: '/funktionen#mieterwechsel' },
  { label: 'Mehrfamilienhaus', href: '/nebenkostenabrechnung-erstellen' },
  { label: 'Mehrere Häuser', href: '/funktionen#mehrere-objekte' },
  { label: 'Vermietete Eigentumswohnung', href: '/funktionen#mehrere-objekte' },
  { label: 'WG-Zimmer einer Wohnung', href: '/funktionen#wg-zimmer' },
  { label: 'Mieterwechsel und Leerstand', href: '/funktionen#mieterwechsel' },
  { label: 'Heizkosten selbst abrechnen', href: '/heizkostenabrechnung' },
  { label: 'Pauschale oder Warmmiete', href: '/funktionen#pauschale' },
]
