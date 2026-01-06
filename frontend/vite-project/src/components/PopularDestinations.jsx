/**
 * PopularDestinations 컴포넌트
 * - Google Places API를 활용하여 인기 여행지 30곳을 표시
 * - 카드 형식으로 도시 사진과 이름 표시
 * - 클릭 시 모달로 상세 정보 표시
 */

import React, { useState, useEffect } from 'react';

// ---- rate limit helpers -------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status) => {
  // 구글 프록시 403(일시적 차단/제한), 429(쿼터), 500/502/503/504 등은 재시도
  return status === 403 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

async function fetchJsonWithRetry(url, options = {}, {
  retries = 2,
  backoffMs = 700,
  maxBackoffMs = 2500,
  label = 'request',
} = {}) {
  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    try {
      console.debug(`[retry] ${label} try #${attempt + 1} →`, url);
      const res = await fetch(url, options);
      if (!res.ok) {
        if (isRetryableStatus(res.status) && attempt < retries) {
          // 지수 백오프 + 지터
          const jitter = Math.random() * 0.25 * backoffMs;
          const delay = Math.min(backoffMs * Math.pow(2, attempt) + jitter, maxBackoffMs);
          console.warn(`[retry] ${label} HTTP ${res.status}. retry in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries})`);
          await sleep(delay);
          attempt += 1;
          continue;
        }
        const text = await res.text().catch(() => '');
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        err.body = text;
        throw err;
      }
      const data = await res.json();
      if (attempt > 0) console.info(`[retry] ${label} succeeded on attempt #${attempt + 1}`);
      return data;
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        const jitter = Math.random() * 0.25 * backoffMs;
        const delay = Math.min(backoffMs * Math.pow(2, attempt) + jitter, maxBackoffMs);
        console.warn(`[retry] ${label} error: ${e?.message || e}. retry in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
        attempt += 1;
        continue;
      }
      console.error(`[retry] ${label} failed after ${attempt + 1} attempts`, e);
      throw lastError;
    }
  }
  throw lastError || new Error('Unknown fetch error');
}

/**
 * 30개 인기 여행지 목록
 * - autocomplete API로 실제 Place ID를 가져옴
 */
const POPULAR_DESTINATIONS = [
  // 아시아
  { id: 1, name: '도쿄', country: '일본', searchQuery: 'Tokyo', description: '일본의 수도로 현대적인 문화와 전통이 공존하는 도시\n에펠탑과 세계적인 미식의 천국' },
  { id: 2, name: '교토', country: '일본', searchQuery: 'Kyoto', description: '고요함과 아름다운 전통 건축물이 있는 고대 일본의 수도\n불교 사원과 봄벚꽃의 낭만' },
  { id: 3, name: '방콕', country: '태국', searchQuery: 'Bangkok', description: '태국의 왕궁과 화려한 불교 사원으로 유명한 대도시\n태국 요리와 시장의 활기' },
  { id: 4, name: '치앙마이', country: '태국', searchQuery: 'Chiang Mai', description: '북부 산악 지대의 미식과 전통 마사지로 유명\n원숭이와 에코 투어의 중심' },
  { id: 5, name: '발리', country: '인도네시아', searchQuery: 'Bali', description: '열대 해변과 평화로운 사원이 있는 낙원 같은 휴양지\n서핑과 요가로 힐링하는 곳' },
  { id: 6, name: '싱가포르', country: '싱가포르', searchQuery: 'Singapore', description: '현대적 식문화와 다양한 쇼핑을 즐길 수 있는 깨끗한 도시\n마리나 베이와 가든스 바이 더 베이' },
  { id: 7, name: '타이베이', country: '대만', searchQuery: 'Taipei', description: '재래시장과 현대 건축이 어우러진 미식의 도시\n타이베이 101과 야시장의 매력' },
  { id: 8, name: '하노이', country: '베트남', searchQuery: 'Hanoi', description: '오래된 거리와 프랑스 식민지 건물로 가득한 역사적 도시\n보님이와 베트남 커피의 고향' },
  { id: 9, name: '다낭', country: '베트남', searchQuery: 'Da Nang', description: '아름다운 해변과 맛있는 베트남 요리가 있는 휴양도시\n골든 브릿지와 바나힐에서 즐기는 액티비티' },
  
  // 유럽
  { id: 10, name: '파리', country: '프랑스', searchQuery: 'Paris', description: '예술과 낭만의 도시 에펠탑과 루브르 박물관\n파리지앵의 일상과 화려한 건축물' },
  { id: 11, name: '런던', country: '영국', searchQuery: 'London', description: '빅벤과 타임즈 강에서 영국 문화의 매력을 경험\n아침 식사와 티타임의 고전적인 도시' },
  { id: 12, name: '로마', country: '이탈리아', searchQuery: 'Rome', description: '콜로세움과 고대 유적이 여전히 살아있는 역사의 중심지\n이탈리안 파스타와 갤래토의 본고장' },
  { id: 13, name: '피렌체', country: '이탈리아', searchQuery: 'Florence', description: '르네상스 미술과 건축이 가득한 작은 유럽의 보석\n두오모와 우피치 미술관' },
  { id: 14, name: '바르셀로나', country: '스페인', searchQuery: 'Barcelona', description: '가우디의 건축물과 활기찬 야외 분위기가 돋보이\n라 부푸티바와 타파스의 천국' },
  { id: 15, name: '리스본', country: '포르투갈', searchQuery: 'Lisbon', description: '노란 트램과 포르투 와인으로 유명한 서유럽의 보석\n파스텔 드 나타와 전통 포르투갈 요리' },
  { id: 16, name: '프라하', country: '체코', searchQuery: 'Prague', description: '중세 시대 분위기의 아름다운 성과 다리가 있는 낭만\n체코 맥주와 프라하 성' },
  { id: 17, name: '인터라켄', country: '스위스', searchQuery: 'Interlaken', description: '알프스 산맥과 호수로 둘러싸인 최고의 자연 휴양지\n하이킹과 스키로 즐기는 액티비티' },
  { id: 18, name: '베를린', country: '독일', searchQuery: 'Berlin', description: '변화하는 역사와 현대적인 예술이 만나는 독일의 수도\n베를린 장벽과 클럽 문화' },
  
  
  // 아메리카
  { id: 20, name: '뉴욕', country: '미국', searchQuery: 'New York', description: '타임스퀘어와 자유의 여신상이 있는 세계적인 대도시\n브로드웨이 쇼와 뉴욕 스타일 피자' },
  { id: 21, name: '로스앤젤레스', country: '미국', searchQuery: 'Los Angeles', description: '할리우드와 비치의 도시 셀러브리티와 서핑의 낙원\n산타 모니카 해변과 유니버설 스튜디오' },
  { id: 22, name: '밴쿠버', country: '캐나다', searchQuery: 'Vancouver', description: '산과 바다가 만나 자연을 느낄 수 있는 서캐나다의 거울도시\n스탠리 파크와 서부 캐나다의 자연 미식' },
  { id: 23, name: '칸쿤', country: '멕시코', searchQuery: 'Cancun', description: '푸르른 카리브해와 휴양 리조트의 대표 여행지\n올인클루시브와 마야 문명 유적지' },
  { id: 24, name: '부에노스아이레스', country: '아르헨티나', searchQuery: 'Buenos Aires', description: '탱고와 아르헨티나 스테이크로 유명한 남미의 파리\n라 보카와 아르헨티나 와인' },
  
  // 오세아니아
  { id: 25, name: '시드니', country: '호주', searchQuery: 'Sydney', description: '오페라 하우스와 해안 절경으로 유명한 호주의 대표 도시\n하버 브릿지와 본디 해변' },
  { id: 26, name: '멜버른', country: '호주', searchQuery: 'Melbourne', description: '카페 문화와 예술로 가득한 호주에서 가장 살기 좋은 도시\n그레이 스트리트와 멜버른 컵 레이스' },
  { id: 27, name: '퀸스타운', country: '뉴질랜드', searchQuery: 'Queenstown', description: '번지 점프와 스키로 유명한 모험과 아름다운 자연이 있는 곳\n밀포드 사운드와 뉴질랜드 와인' },
  
  // 국내
//   { id: 28, name: '서울', country: '대한민국', searchQuery: 'Seoul' },
//   { id: 29, name: '부산', country: '대한민국', searchQuery: 'Busan' },
//   { id: 30, name: '제주', country: '대한민국', searchQuery: 'Jeju' },
];

const CACHE_KEY = 'popularDestinations_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간

const PopularDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [destinationDetails, setDestinationDetails] = useState(null);
  const imgRetryRef = React.useRef(new Map());
  
  // 검색 관련 state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const handleImageError = (dest, ev) => {
    const key = dest.id;
    const attempts = imgRetryRef.current.get(key) || 0;
    if (attempts < 2) {
      imgRetryRef.current.set(key, attempts + 1);
      const delay = 600 * (attempts + 1) + Math.random() * 200;
      console.warn(`[img] ${dest.name} image error → retry #${attempts + 1} in ${Math.round(delay)}ms`);
      setTimeout(() => {
        try {
          const currentSrc = ev?.target?.src || dest.photoUrl || '';
          const url = new URL(currentSrc, window.location.origin);
          url.searchParams.set('cb', Date.now().toString()); // 캐시 우회
          ev.target.src = url.toString();
        } catch {
          const sep = (dest.photoUrl && dest.photoUrl.includes('?')) ? '&' : '?';
          ev.target.src = `${dest.photoUrl}${sep}cb=${Date.now()}`;
        }
      }, delay);
      return;
    }
    console.error(`[img] ${dest.name} image failed after ${attempts + 1} attempts. Fallback to initial.`);
    imgRetryRef.current.delete(key);
    // 최종 실패 시 카드만 이니셜 폴백으로 변경
    setDestinations(prev => prev.map(d => d.id === dest.id ? { ...d, photoUrl: null } : d));
  };

  const handleImageLoad = (dest) => {
    if (imgRetryRef.current.has(dest.id)) {
      console.info(`[img] ${dest.name} image loaded after retry.`);
    }
    imgRetryRef.current.delete(dest.id);
  };

  // 초기 로드: localStorage 캐시 확인 후 없으면 API로 가져오기
  useEffect(() => {
    let cancelled = false;
    let firstLoaded = false;
    const perItemDelayMs = 260; // 각 도시 호출 사이 간격(레이트리밋 완화)
    
    // localStorage에서 캐시 확인
    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // 캐시가 만료되지 않았고, 데이터가 있으면 사용
        if (now - timestamp < CACHE_EXPIRY_MS && data && data.length > 0) {
          console.log(`✅ Loading ${data.length} destinations from cache`);
          return data;
        }
        
        // 만료된 캐시 삭제
        localStorage.removeItem(CACHE_KEY);
        return null;
      } catch (error) {
        console.warn('Failed to load cache:', error);
        return null;
      }
    };
    
    // localStorage에 캐시 저장
    const saveToCache = (data) => {
      try {
        const cacheData = {
          data: data,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log(`💾 Cached ${data.length} destinations`);
      } catch (error) {
        console.warn('Failed to save cache:', error);
      }
    };
    
    const fetchAllDestinations = async () => {
      setLoading(true);
      
      // 먼저 캐시 확인
      const cachedData = loadFromCache();
      if (cachedData) {
        setDestinations(cachedData);
        setLoading(false);
        firstLoaded = true;
        console.log('🚀 Loaded from cache, skipping API calls');
        return;
      }
      
      setDestinations([]); // 초기화
      
      const testDestinations = POPULAR_DESTINATIONS; // 전체 30개 처리
      const fetchedDestinations = []; // API로 가져온 데이터를 모으기 위한 배열
      
      // 🚀 점진적 로딩: 각 도시를 가져오는 즉시 화면에 표시
      for (const dest of testDestinations) {
        if (cancelled) return;
        
        try {
          // 호출 간 간격 주기
          await sleep(perItemDelayMs);

          const autocompleteData = await fetchJsonWithRetry(
            '/api/places/autocomplete',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ q: dest.searchQuery })
            },
            { retries: 3, backoffMs: 800, maxBackoffMs: 3000, label: `AC ${dest.name}` }
          );
          const normalized = autocompleteData.normalizedSuggestions || [];
          
          if (normalized.length === 0) throw new Error('No results');
          
          const placeId = normalized[0].placeId;
          
          const detailsData = await fetchJsonWithRetry(
            `/api/places/details?placeId=${encodeURIComponent(placeId)}`,
            {},
            { retries: 3, backoffMs: 900, maxBackoffMs: 3500, label: `DETAILS ${dest.name}` }
          );
          
          let photoUrl = null;
          if (detailsData.photos && detailsData.photos.length > 0) {
            const photoName = detailsData.photos[0].name;
            photoUrl = `/api/places/photo?name=${encodeURIComponent(photoName)}&maxWidth=400`;
          }

          const newDest = {
            id: dest.id,
            name: dest.name,
            country: dest.country,
            placeId: placeId,
            displayName: detailsData.displayName?.text || dest.name,
            photoUrl: photoUrl,
            location: detailsData.location,
            summary: dest.description || '',
          };
          
          // fetchedDestinations 배열에 추가
          fetchedDestinations.push(newDest);
          
          // ✨ 즉시 화면에 추가!
          if (!cancelled) {
            setDestinations(prev => [...prev, newDest]);
            
            // 🎯 첫 번째 데이터가 로드되면 즉시 로딩 해제!
            if (!firstLoaded) {
              setLoading(false);
              firstLoaded = true;
              console.log('🚀 First destination loaded, showing UI!');
            }
            
            console.log(`✅ Added ${dest.name} to display (photo: ${photoUrl ? 'YES' : 'NO'})`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to fetch ${dest.name}:`, error);
          
          // 실패해도 기본 정보로 추가
          const fallback = {
            id: dest.id,
            name: dest.name,
            country: dest.country,
            placeId: null,
            displayName: dest.name,
            photoUrl: null,
            location: null,
            summary: dest.description || '',
          };
          
          fetchedDestinations.push(fallback);
          
          if (!cancelled) {
            setDestinations(prev => [...prev, fallback]);
            
            if (!firstLoaded) {
              setLoading(false);
              firstLoaded = true;
            }
          }
        }
      }
      
      if (!cancelled) {
        console.log('🎉 All destinations loaded!');
        // 모든 데이터를 가져온 후 localStorage에 캐시 저장
        if (fetchedDestinations.length > 0) {
          saveToCache(fetchedDestinations);
        }
      }
    };

    fetchAllDestinations();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // 도시 이름을 한국어로 매핑
  const getCityNameInKorean = (englishName) => {
    const cityNameMap = {
      'Dubai': '두바이',
      'Amsterdam': '암스테르담',
      'Tokyo': '도쿄',
      'Paris': '파리',
      'London': '런던',
      'New York': '뉴욕',
      'Seoul': '서울',
      'Bangkok': '방콕',
      'Singapore': '싱가포르',
      'Hong Kong': '홍콩',
      'Rome': '로마',
      'Barcelona': '바르셀로나',
      'Istanbul': '이스탄불',
      'Prague': '프라하',
      'Vienna': '빈',
      'Berlin': '베를린',
      'Sydney': '시드니',
      'Melbourne': '멜버른',
      'Los Angeles': '로스앤젤레스',
      'San Francisco': '샌프란시스코',
      'Toronto': '토론토',
      'Vancouver': '밴쿠버',
      'Shanghai': '상하이',
      'Beijing': '베이징',
      'Osaka': '오사카',
      'Kyoto': '교토',
      'Taipei': '타이베이',
      'Kuala Lumpur': '쿠알라룸푸르',
      'Bali': '발리',
      'Phuket': '푸켓',
      'Hanoi': '하노이',
      'Ho Chi Minh City': '호치민',
      'Manila': '마닐라',
      'Lisbon': '리스본',
      'Athens': '아테네',
      'Copenhagen': '코펜하겐',
      'Stockholm': '스톡홀름',
      'Zurich': '취리히',
      'Munich': '뮌헨',
      'Milan': '밀라노',
      'Venice': '베네치아',
      'Florence': '피렌체',
      'Madrid': '마드리드',
      'Seville': '세비야',
      'Edinburgh': '에든버러',
      'Dublin': '더블린',
      'Budapest': '부다페스트',
      'Warsaw': '바르샤바',
      'Krakow': '크라쿠프',
      'Cairo': '카이로',
      'Cape Town': '케이프타운',
      'Marrakech': '마라케시',
      'Reykjavik': '레이캬비크',
      'Helsinki': '헬싱키',
      'Oslo': '오슬로',
    };
    
    return cityNameMap[englishName] || englishName;
  };

  // 위키백과에서 한국어 설명 가져오기
  const fetchWikipediaDescription = async (cityName) => {
    try {
      // cityName이 유효한지 확인
      if (!cityName || cityName === 'undefined' || cityName === 'Unknown City' || cityName.length < 2) {
        console.warn('Invalid city name for Wikipedia:', cityName);
        return '';
      }
      
      // 한국어 도시명으로 변환
      const koreanName = getCityNameInKorean(cityName);
      
      console.log(`Fetching Wikipedia for: ${cityName} (${koreanName})`);
      
      // 한국어 이름으로 한국어 위키백과 시도
      const koResponse = await fetch(
        `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(koreanName)}`,
        { signal: AbortSignal.timeout(3000) } // 3초 타임아웃
      );
      
      if (koResponse.ok) {
        const koData = await koResponse.json();
        console.log('Korean Wikipedia response:', koData);
        
        // 도시 관련 페이지인지 확인 (disambiguation 페이지나 이상한 페이지 제외)
        if (koData.extract && 
            koData.extract.length > 50 && 
            !koData.extract.includes('동음이의') &&
            !koData.extract.includes('컴퓨팅') &&
            !koData.extract.includes('프로그래밍') &&
            koData.type !== 'disambiguation') {
          return koData.extract;
        }
      }
      
      // 영문 이름으로도 한국어 위키백과 시도
      if (koreanName !== cityName) {
        const koResponse2 = await fetch(
          `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`,
          { signal: AbortSignal.timeout(3000) }
        );
        
        if (koResponse2.ok) {
          const koData2 = await koResponse2.json();
          if (koData2.extract && 
              koData2.extract.length > 50 && 
              !koData2.extract.includes('동음이의') &&
              !koData2.extract.includes('컴퓨팅') &&
              !koData2.extract.includes('프로그래밍') &&
              koData2.type !== 'disambiguation') {
            return koData2.extract;
          }
        }
      }
      
      return '';
    } catch (error) {
      console.warn('Wikipedia fetch failed:', error);
      return '';
    }
  };

  // 카드 클릭 시 상세 정보 가져오기
  const handleCardClick = async (destination) => {
    setSelectedDestination(destination);
    setDetailsLoading(true);
    setDestinationDetails(null);

    try {
      const data = await fetchJsonWithRetry(
        `/api/places/details?placeId=${encodeURIComponent(destination.placeId)}`,
        {},
        { retries: 3, backoffMs: 900, maxBackoffMs: 3500, label: `DETAILS(modal) ${destination.name}` }
      );
      
      // 원본 도시 정보에서 description 가져오기
      const originalDest = POPULAR_DESTINATIONS.find(d => d.id === destination.id);
      let description = originalDest?.description || '';
      
      // 검색으로 들어온 도시는 여러 소스에서 설명 가져오기
      if (!description) {
        // 1. Google Places API의 editorialSummary
        if (data.editorialSummary) {
          description = data.editorialSummary?.text || data.editorialSummary || '';
        }
        
        // 2. 위키백과에서 설명 가져오기
        if (!description || description.length < 50) {
          const wikiDesc = await fetchWikipediaDescription(destination.name);
          if (wikiDesc) {
            description = wikiDesc;
          }
        }
      }
      
      // 설명이 없으면 기본 메시지
      if (!description || description.length < 20) {
        description = `${destination.name}은(는) 매력적인 여행지입니다. 이 도시를 탐험하며 특별한 경험을 만들어보세요.`;
      }
      
      setDestinationDetails({
        displayName: data.displayName?.text || destination.name,
        formattedAddress: data.formattedAddress || destination.country || '',
        editorialSummary: description,
        photos: data.photos || [],
      });
    } catch (error) {
      console.error('Failed to fetch destination details:', error);
      
      // 에러 발생 시에도 description 가져오기
      const originalDest = POPULAR_DESTINATIONS.find(d => d.id === destination.id);
      let description = originalDest?.description || '';
      
      // 위키백과 재시도
      if (!description) {
        try {
          const wikiDesc = await fetchWikipediaDescription(destination.name);
          if (wikiDesc) {
            description = wikiDesc;
          }
        } catch {
          description = `${destination.name}에 대한 정보를 불러오는 중 문제가 발생했습니다.`;
        }
      }
      
      if (!description) {
        description = `${destination.name}에 대한 정보를 불러오는 중 문제가 발생했습니다.`;
      }
      
      setDestinationDetails({
        displayName: destination.name,
        formattedAddress: destination.country || '',
        editorialSummary: description,
        photos: [],
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedDestination(null);
    setDestinationDetails(null);
    setDetailsLoading(false);
  };

  // 도시 검색 함수
  const handleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchDropdown(true);

    try {
      const data = await fetchJsonWithRetry(
        '/api/places/autocomplete',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ q: query })
        },
        { retries: 2, backoffMs: 500, maxBackoffMs: 2000, label: `Search ${query}` }
      );

      console.log('Search API response:', data); // 디버깅용

      const normalized = data.normalizedSuggestions || [];
      
      // 타입 필터링 없이 모든 결과 표시 (도시뿐만 아니라 관련된 모든 장소)
      // 또는 타입 체크를 더 유연하게
      const cities = normalized.filter(item => {
        const types = item.types || [];
        // 더 많은 타입 허용
        return types.length === 0 || // 타입 정보가 없어도 허용
               types.includes('locality') || 
               types.includes('administrative_area_level_1') ||
               types.includes('administrative_area_level_2') ||
               types.includes('administrative_area_level_3') ||
               types.includes('postal_town') ||
               types.includes('sublocality') ||
               types.includes('neighborhood');
      });

      console.log('Filtered cities:', cities); // 디버깅용
      setSearchResults(cities.slice(0, 10)); // 최대 10개만 표시
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 검색 결과 선택 시
  const handleSearchResultClick = async (result) => {
    console.log('Selected search result:', result); // 디버깅용
    
    // API 응답 구조에 맞게 도시 이름 추출
    const cityName = result.text || result.mainText || result.displayName?.text || result.displayName || 'Unknown City';
    const countryName = result.secondaryText || '';
    
    // 선택한 도시의 상세 정보를 가져와서 모달로 표시
    const cityData = {
      id: `search-${result.placeId}`,
      name: cityName,
      country: countryName,
      placeId: result.placeId,
      displayName: cityName,
      photoUrl: null,
      location: null,
      summary: '',
    };
    
    console.log('City data for modal:', cityData); // 디버깅용
    
    // 검색 상태 초기화 (모달 열기 전에)
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
    
    await handleCardClick(cityData);
  };

  if (loading) {
    return (
      <section id="popular-destinations" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">인기 여행지</h2>
            <p className="text-gray-600 text-lg">전 세계에서 가장 사랑받는 여행지를 둘러보세요</p>
          </div>
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="popular-destinations" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-3">인기 여행지</h2>
          <p className="text-gray-600 text-lg">전 세계에서 가장 사랑받는 여행지를 둘러보세요</p>
        </div>

        {/* 검색창 */}
        <div className="max-w-2xl mx-auto mb-12 relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isComposing) {
                  handleSearch(e.target.value);
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionUpdate={() => setIsComposing(true)}
              onCompositionEnd={(e) => {
                setIsComposing(false);
                handleSearch(e.target.value);
              }}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setShowSearchDropdown(true);
                }
              }}
              onBlur={() => {
                // 드롭다운 항목 클릭을 위해 약간의 딜레이
                setTimeout(() => setShowSearchDropdown(false), 200);
              }}
              placeholder="여기에 없는 도시를 검색해보세요 (예: 암스테르담, 두바이, 상하이...)"
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-md"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {searchLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* 검색 결과 드롭다운 */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-50">
              {searchResults.map((result, index) => {
                // 도시명, 국가명 추출
                const cityName = result.text || result.mainText || '';
                const countryInfo = result.secondaryText || '';
                
                return (
                  <button
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault(); // blur 이벤트 방지
                      handleSearchResultClick(result);
                    }}
                    className="w-full px-6 py-4 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">
                        {cityName}{countryInfo ? `, ${countryInfo}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 검색 결과 없음 */}
          {showSearchDropdown && !searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 text-center z-50">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">검색 결과가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">다른 검색어를 시도해보세요</p>
            </div>
          )}
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-3 max-[639px]:grid-cols-1 gap-6">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => handleCardClick(dest)}
              className="group cursor-pointer bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
            >
              {/* 이미지 */}
              <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                {dest.photoUrl ? (
                  <img
                    src={dest.photoUrl}
                    alt={dest.displayName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => handleImageError(dest, e)}
                    onLoad={() => handleImageLoad(dest)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
                    {dest.name.charAt(0)}
                  </div>
                )}
                {/* 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{dest.name}</h3>
                <p className="text-sm text-gray-500">{dest.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {selectedDestination && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {detailsLoading ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            ) : destinationDetails ? (
              <>
                {/* 사진 갤러리 */}
                {destinationDetails.photos.length > 0 && (
                  <div className="relative h-80 bg-gray-200 overflow-hidden">
                    <img
                      src={`/api/places/photo?name=${encodeURIComponent(destinationDetails.photos[0].name)}&maxWidth=800`}
                      alt={destinationDetails.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* 콘텐츠 */}
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {destinationDetails.displayName}
                  </h2>
                  {destinationDetails.formattedAddress && (
                    <p className="text-gray-500 mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {destinationDetails.formattedAddress}
                    </p>
                  )}

                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {destinationDetails.editorialSummary}
                    </p>
                  </div>

                  {/* CTA 버튼 */}
                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => {
                        // 여행 계획 페이지로 이동하며 해당 도시 정보 전달
                        window.location.href = `/trip-plan-ex1?city=${encodeURIComponent(selectedDestination.name)}&placeId=${encodeURIComponent(selectedDestination.placeId)}`;
                      }}
                      className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      이 도시로 여행 계획 시작하기
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                정보를 불러올 수 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default PopularDestinations;

