-- Download-Zähler: je Tag, Plattform und Herkunftsseite eine Zeile. Keine personenbezogenen Daten.
CREATE TABLE IF NOT EXISTS downloads (
  day TEXT NOT NULL,
  platform TEXT NOT NULL,
  source TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, platform, source)
);
