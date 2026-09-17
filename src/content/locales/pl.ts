import type { Copy } from "../copy";

// Polish plural: 1 = one, 2-4 (except 12-14) = few, rest = many.
const plural = (n: number, one: string, few: string, many: string) => {
  if (n === 1) return one;
  const d = n % 10;
  const h = n % 100;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
};

export const pl: Copy = {
  brand: {
    name: "SolGig",
    tagline: "Rynek, na którym kupują zarówno ludzie, jak i agenci AI.",
  },

  nav: {
    links: [
      { label: "Jak to działa", href: "#how" },
      { label: "Dla agentów", href: "#agents" },
      { label: "Jak rozlicza się płatność", href: "#trust" },
      { label: "Z tablicy", href: "#feed" },
    ],
    signIn: "Otwórz aplikację",
    cta: "Zacznij sprzedawać",
    language: "Język",
  },

  hero: {
    eyebrow: "Działa na Solana devnet i mainnet",
    title: "Twój następny klient może nie być człowiekiem.",
    sub: "SolGig to rynek, na którym każdy, kto ma parę kluczy Solana, może kupować i sprzedawać: projektanci, programiści, muzycy i pracujący dla nich agenci AI. Agent nie założy konta w banku ani nie przejdzie weryfikacji karty. Potrafi za to podpisać transakcję. Tutaj to wystarczy.",
    primary: "Zacznij sprzedawać",
    secondary: "Zobacz, jak agent coś kupuje",
    statFee: "Prowizja platformy, bez ukrytych opłat",
    statSettle: "Typowy czas rozliczenia płatności",
    statEndpoint: "Endpoint, którego agent potrzebuje do zakupów",
    live: "Działa na Solana",
  },

  proof: {
    line: "Wszystko, co opisujemy poniżej, działa teraz w obu sieciach",
  },

  how: {
    title: "Trzy kroki od oferty do zapłaty",
    steps: [
      {
        k: "01",
        title: "Wystaw to, co tworzysz",
        body: "Prześlij plik albo opisz usługę. Ustal cenę w SOL. Oferta trafia jednocześnie do sklepu dla ludzi i do katalogu czytelnego dla maszyn.",
      },
      {
        k: "02",
        title: "Niech znajdzie cię ktokolwiek — lub cokolwiek",
        body: "Ludzie przeglądają tablicę i rynek. Agenci czytają endpoint katalogu, porównują ceny i sami wybierają. Ty w obu przypadkach nie robisz nic inaczej.",
      },
      {
        k: "03",
        title: "Zapłata przy dostawie",
        body: "Produkty cyfrowe odblokowują się, gdy tylko płatność zostanie zweryfikowana w łańcuchu. Pieniądze za usługi czekają w escrow i trafiają do ciebie, gdy kupujący zaakceptuje pracę.",
      },
    ],
  },

  agents: {
    title: "Zbudowane tak, by klientem mogła być maszyna",
    sub: "Jeden publiczny endpoint opisuje każdą ofertę i dokładne kroki logowania, płatności i odbioru. Bez SDK do instalowania i bez proszenia o klucz API.",
    points: [
      {
        title: "Logowanie parą kluczy",
        body: "Uwierzytelnianie to podpisany nonce. Jeśli potrafisz podpisać wiadomość Solana, masz konto. Dotyczy to każdego portfela — i każdego agenta.",
      },
      {
        title: "Katalog, który sam się opisuje",
        body: "GET /api/agent/catalog zwraca wszystkie produkty i usługi z cenami oraz pełny przepis na proces zakupu. Agent, który nigdy nie widział SolGig, może dokończyć zakup na podstawie tej jednej odpowiedzi.",
      },
      {
        title: "Nic na słowo",
        body: "Gdy kupujący twierdzi, że zapłacił, serwer pobiera transakcję z łańcucha i sam sprawdza podpisującego, kwoty i zmiany sald. Jeden podpis rozlicza dokładnie jedno zamówienie, raz na zawsze.",
      },
    ],
    demo: "Uruchom demo: nowa para kluczy bez żadnej historii znajduje produkt, płaci za niego i go pobiera. Około trzydziestu sekund, bez przeglądarki i bez człowieka.",
    openCatalog: "Otwórz katalog na żywo",
  },

  sellers: {
    title: "Dla ludzi, którzy sprzedają własną pracę",
    forSellers: {
      heading: "Jeśli sprzedajesz",
      points: [
        "Zatrzymujesz 97,5 procent z każdej sprzedaży.",
        "Twoją ofertę widzą kupujący ludzie i agenci, bez żadnej dodatkowej pracy.",
        "Twoi obserwujący idą za tobą. Nikt nie odsprzedaje ci twojej własnej publiczności.",
      ],
    },
    forBuyers: {
      heading: "Jeśli kupujesz",
      points: [
        "Płatności za usługi są trzymane w escrow, dopóki nie zaakceptujesz pracy.",
        "Serwer sprawdza każdą płatność w łańcuchu, zanim cokolwiek zostanie odblokowane.",
        "Każde potwierdzenie to transakcja, którą możesz sprawdzić samodzielnie.",
      ],
    },
  },

  trust: {
    title: "Jak naprawdę rozlicza się płatność",
    sub: "Pieniądze przechodzą przez Solana, a zamówienie idzie dalej dopiero wtedy, gdy serwer zweryfikuje przelew w łańcuchu: podpisującego, kwotę i zmianę salda.",
    nodes: [
      { title: "Kupujący płaci", body: "Jedna transakcja: cena dla sprzedawcy lub do escrow, prowizja dla platformy." },
      { title: "Serwer weryfikuje", body: "Transakcja jest pobierana z łańcucha i sprawdzana punkt po punkcie. Bez weryfikacji nie ma pobrania." },
      { title: "Praca zmienia właściciela", body: "Pliki otwierają się od razu. Escrow za usługę zwalnia środki, gdy kupujący zaakceptuje pracę, po potrąceniu prowizji 2,5 procent." },
    ],
  },

  feed: {
    title: "Rzut oka na tablicę",
    sub: "Podgląd tylko do odczytu, zbudowany z tej samej karty, której używa aplikacja.",
    buy: "Kup",
    posts: [
      {
        author: "mira.lens",
        handle: "@mira",
        time: "2 godz.",
        body: "Nowa paczka do Lightrooma już jest. Ciepłe uliczne tony, 12 presetów, przeciągnij i upuść.",
        price: "1.8 SOL",
        likes: 214,
        comments: 31,
      },
      {
        author: "kojibeats",
        handle: "@koji",
        time: "5 godz.",
        body: "W tym tygodniu mam dwa wolne terminy na miks. Wyślij mi szkic, a dopracuję dół pasma.",
        price: "0.9 SOL",
        likes: 98,
        comments: 12,
      },
      {
        author: "studio.fauna",
        handle: "@fauna",
        time: "1 dz.",
        body: "Panel w Notion dla freelancerów. Śledzi faktury, klientów i to, co wciąż jest do zapłaty.",
        price: "3.2 SOL",
        likes: 377,
        comments: 64,
      },
    ],
  },

  finalCta: {
    title: "Pierwszy rynek, na którym twój agent może robić zakupy",
    sub: "Wystaw coś dzisiaj. Możesz nigdy nie poznać kolejnego kupującego, bo może nim być skrypt z parą kluczy i budżetem.",
    primary: "Zacznij sprzedawać",
    secondary: "Przeczytaj katalog dla agentów",
  },

  landing: {
    figures: ["Zostaje ci z każdej sprzedaży", "Na opublikowanie oferty", "Mediana czasu wypłaty", "W łańcuchu i ostateczne"],
    chargebacks: " obciążeń zwrotnych",
    replies: "odpowiedzi",
    buy: "Kup",
    step: "krok",
    replayed: "odtworzone z prawdziwej transakcji na devnet",
    gallery: "Zobacz galerię animacji",
  },

  footer: {
    tagline: "Rynek na Solana dla ludzi, którzy coś tworzą — i dla agentów, którzy to kupują.",
    columns: [
      {
        title: "Produkt",
        links: [
          { label: "Tablica", href: "/feed" },
          { label: "Rynek", href: "/marketplace" },
          { label: "Usługi", href: "/services" },
          { label: "Zamówienia", href: "/orders" },
        ],
      },
      {
        title: "Dla twórców",
        links: [
          { label: "Katalog dla agentów", href: "/api/agent/catalog" },
          { label: "Stan usługi", href: "/api/health" },
          { label: "Kod źródłowy", href: "https://github.com/bryankwandou/solgig" },
        ],
      },
      {
        title: "Sieci",
        links: [
          { label: "Devnet", href: "https://solgig.vercel.app" },
          { label: "Mainnet", href: "https://solgig-mainnet.vercel.app" },
        ],
      },
    ],
    legal: "SolGig działa na Solana. Płatność odbywa się w łańcuchu i jest ostateczna po przyjęciu zamówienia.",
  },

  app: {
    nav: [
      { href: "/feed", label: "Tablica" },
      { href: "/marketplace", label: "Rynek" },
      { href: "/services", label: "Usługi" },
      { href: "/orders", label: "Zamówienia" },
      { href: "/dashboard", label: "Panel" },
    ],
    mainnetBanner: "Mainnet — prawdziwe SOL, prawdziwe płatności. Transakcji nie da się cofnąć.",
    devnetBanner: "Działa na Solana devnet. Każda płatność jest rozliczana on-chain w SOL z devnetu.",
    signingIn: "Logowanie…",
    signOut: "Wyloguj się",
    connectedAs: "Połączono jako",
  },

  pages: {
    common: {
      loading: "Wczytywanie…",
      loadMore: "Wczytaj więcej",
      send: "Wyślij",
      tx: "Tx",
      viewTx: "Zobacz transakcję",
      opening: "Otwieranie zamówienia…",
      approve: "Zatwierdź w portfelu…",
      confirming: "Potwierdzanie na Solana…",
      connectTopBar: "Najpierw połącz portfel przyciskiem na górnym pasku.",
      offline: "Nie udało się połączyć z SolGig. Sprawdź połączenie i spróbuj ponownie.",
      sold: (n: number) => `${n} ${plural(n, "sprzedany", "sprzedane", "sprzedanych")}`,
      delivery: (n: number) => (n === 1 ? "Dostawa w 1 dzień" : `Dostawa w ${n} dni`),
    },
    status: {
      pending: "czeka na płatność",
      paid: "opłacone",
      releasing: "trwa wypłata",
      completed: "zakończone",
    } as Record<string, string>,
    feed: {
      title: "Tablica",
      sub: "Co ludzie tworzą i sprzedają w tej chwili.",
      placeholder: "Pokaż coś, co zrobiłeś, albo termin, który zwalniasz.",
      post: "Opublikuj",
      posting: "Publikowanie…",
      connect: "Połącz portfel, aby publikować i reagować.",
      loading: "Wczytywanie tablicy…",
      empty: "Na twojej tablicy jest cicho. Opublikuj coś jako pierwszy.",
      comments: (n: number) => `${n} ${plural(n, "komentarz", "komentarze", "komentarzy")}`,
      addComment: "Dodaj komentarz",
      joinConvo: "Połącz portfel, aby dołączyć do rozmowy.",
    },
    market: {
      title: "Rynek",
      sub: "Produkty cyfrowe od twórców na Solana.",
      search: "Szukaj ofert",
      empty: "Nic tu jeszcze nie ma. Wystaw pierwszą rzecz w swoim panelu, a pojawi się na samej górze.",
    },
    product: {
      notFound: "Nie znaleźliśmy tego produktu. Mógł zostać przeniesiony.",
      by: "autor:",
      noDescription: "Brak opisu.",
      reviews: "Opinie",
      noReviews: "Nie ma jeszcze opinii. Napisz jako pierwszy, jak poszło.",
      paidNote: "Płatność na Solana. Przelew trafia do sprzedawcy w ciągu kilku sekund.",
      buyFor: (price: string) => `Kup za ${price}`,
      own: "To twoja oferta",
      connectToBuy: "Połącz portfel, aby kupić.",
      failed: "Zakup nie został ukończony.",
      done: "Gotowe. Płatność została rozliczona, a zamówienie zrealizowane.",
      download: "Pobierz swoje pliki",
      leaveReview: "Wystaw opinię",
      howWas: "Jak było?",
      submitReview: "Wyślij opinię",
      thanks: "Dziękujemy za opinię.",
      moreFrom: "Więcej od tego sprzedawcy",
      moreOn: "Inne oferty w SolGig",
    },
    services: {
      title: "Usługi",
      sub: "Zarezerwuj czas ludzi, którzy coś tworzą. Płatność jest trzymana w escrow na Solana i trafia do sprzedawcy, gdy oznaczysz pracę jako dostarczoną.",
      empty: "Nie ma jeszcze żadnych usług. Dodaj pierwszą w swoim panelu.",
      bookFor: (price: string) => `Zarezerwuj za ${price}`,
      own: "Twoja oferta",
      connect: "Najpierw połącz portfel.",
      failed: "Rezerwacja nie została ukończona.",
      booked: "Zarezerwowano. Śledź ją na stronie Zamówienia i zaakceptuj, gdy praca dotrze.",
    },
    orders: {
      connect: "Połącz portfel, aby zobaczyć, co kupiłeś.",
      loadError: "Nie udało się wczytać zamówień. Odśwież stronę, aby spróbować ponownie.",
      title: "Twoje zamówienia",
      sub: "Wszystko, co kupiłeś, z plikami do pobrania, które zostają tutaj dostępne.",
      emptyBefore: "Nic tu jeszcze nie ma.",
      browse: "Przejrzyj rynek,",
      emptyAfter: "aby znaleźć pierwszą rzecz dla siebie.",
      from: "od",
      opening: "Otwieranie…",
      download: "Pobierz",
      downloadUnavailable: "Pobieranie nie jest teraz dostępne.",
      releasing: "Zwalnianie środków…",
      checkPayout: "Sprawdź wypłatę",
      accept: "Zaakceptuj i zwolnij środki",
    },
    dashboard: {
      connect: "Połącz portfel, aby zobaczyć swój panel.",
      connectHint: "Użyj przycisku na górnym pasku. Podpiszesz krótką wiadomość, która potwierdzi, że portfel należy do ciebie.",
      title: "Panel",
      newListing: "Nowa oferta",
      earned: "Zarobiono",
      completed: "Zrealizowane zamówienia",
      reputation: "Reputacja",
      products: "Twoje produkty",
      noProducts: "Nie masz jeszcze produktów. Utwórz pierwszy, aby zacząć sprzedawać.",
      purchases: "Twoje zakupy",
      noPurchases: "Nie masz jeszcze zakupów.",
      order: "Zamówienie",
      sales: "Ostatnia sprzedaż",
      noSales: "Nie masz jeszcze sprzedaży. Udostępnij ofertę na tablicy, aby zdobyć pierwszą.",
    },
    newListing: {
      connect: "Połącz portfel, aby utworzyć ofertę.",
      invalid: "Dodaj tytuł i cenę co najmniej 0.001 SOL.",
      title: "Nowa oferta",
      sub: "Opublikuj produkt cyfrowy lub usługę z ceną w SOL.",
      kinds: { product: "Produkt", service: "Usługa" },
      fTitle: "Tytuł",
      fDescription: "Opis",
      fPrice: "Cena w SOL",
      fType: "Rodzaj",
      fFile: "Link do pobrania (kupujący dostaje go po zapłacie)",
      fDays: "Czas dostawy w dniach",
      fTags: "Tagi (oddzielone przecinkami)",
      phTitle: "Paczka presetów w ciepłych ulicznych tonach",
      phDescription: "Co to jest i co dostaje kupujący.",
      phTags: "lightroom, presety, ulica",
      types: {
        template: "Szablon",
        ebook: "E-book",
        code: "Kod",
        design: "Projekt graficzny",
        music: "Muzyka",
        video: "Wideo",
        course: "Kurs",
        preset: "Preset",
        font: "Czcionka",
        other: "Inne",
      } as Record<string, string>,
      saveFailed: "Nie udało się zapisać oferty.",
      publishing: "Publikowanie…",
      publish: "Opublikuj ofertę",
    },
    profile: {
      notFound: "Nikt o takiej nazwie tu nie działa.",
      followers: (n: number) => `${n} ${plural(n, "obserwujący", "obserwujących", "obserwujących")}`,
      following: (n: number) => `Obserwuje: ${n}`,
      ordersDone: (n: number) => `${n} ${plural(n, "zrealizowane zamówienie", "zrealizowane zamówienia", "zrealizowanych zamówień")}`,
      follow: "Obserwuj",
      followingBtn: "Obserwujesz",
      products: "Produkty",
      services: "Usługi",
      posts: "Ostatnie wpisy",
      likes: (n: number) => `${n} ${plural(n, "polubienie", "polubienia", "polubień")}`,
      comments: (n: number) => `${n} ${plural(n, "komentarz", "komentarze", "komentarzy")}`,
    },
    gallery: {
      title: "Galeria animacji",
      intro: "Każdy efekt używany w SolGig, uruchomiony na żywo. Gdy system ma włączone ograniczenie ruchu, każdy z nich zamienia się w spokojne przenikanie.",
      reduced: (on: boolean) => `Ograniczony ruch: ${on ? "wł." : "wył."}`,
      replay: "Odtwórz wejścia ponownie",
      back: "Wróć na stronę główną",
      footer: (n: number) => `Pokazane efekty: ${n}. Z tych samych elementów składają się większe sceny na stronie głównej, gdzie tworzą sekcję otwierającą, przepływ escrow i podgląd tablicy.`,
      demos: [
        ["Pojawienie", "Przenikanie i wsunięcie przy przewijaniu, jeden raz.", "W widoku"],
        ["Kaskada", "Elementy pojawiają się jeden po drugim.", ""],
        ["Dzielony tekst", "Nagłówek odsłania się słowo po słowie.", "Sprzedawaj swoją pracę"],
        ["Maszyna do pisania", "Pisze przy wejściu, potem się zatrzymuje.", ""],
        ["Przycisk magnetyczny", "Przesuwa się w stronę kursora.", "Najedź na mnie"],
        ["Pochylenie", "Karta pochyla się w 3D w stronę kursora.", ""],
        ["Świecąca karta", "Poświata podąża za kursorem wewnątrz.", "Rusz kursorem w środku"],
        ["Licznik", "Odlicza do wartości, gdy jest widoczny.", ""],
        ["Paralaksa", "Porusza się przeciwnie do przewijania.", "Przewiń stronę"],
        ["Pochylenie przy przewijaniu", "Pochyla się zależnie od szybkości przewijania.", "Przewiń szybko"],
        ["Pasek przewijany", "Przewija się sam, zatrzymuje po najechaniu.", ""],
        ["Reflektor", "Miękka poświata podąża za kursorem.", "Rusz kursorem tutaj"],
        ["Wybuch polubienia", "Serce wyskakuje i rozpryskuje się po dotknięciu.", ""],
        ["Migający szkielet", "Blok wczytywania z przesuwającym się połyskiem.", ""],
        ["Pulsująca kropka", "Wskaźnik stanu, który oddycha.", "Działa na Solana"],
        ["Pierścień postępu", "Okrągłe wypełnienie dla trwającej akcji.", ""],
        ["Pływające kule", "Rozmyte kule w kolorach marki dryfują w tle.", ""],
        ["Siatka gradientowa", "Powolne tło w kolorach marki dla sekcji otwierającej.", ""],
      ] as [string, string, string][],
    },
  },
};
