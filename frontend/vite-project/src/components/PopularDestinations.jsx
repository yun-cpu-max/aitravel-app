/**
 * PopularDestinations 컴포넌트
 * - Google Places API를 활용하여 인기 여행지 30곳을 표시
 * - 카드 형식으로 도시 사진과 이름 표시
 * - 클릭 시 모달로 상세 정보 표시
 */

import React, { useState, useEffect } from 'react';

/**
 * 30개 인기 여행지 목록
 * - autocomplete API로 실제 Place ID를 가져옴
 */
const POPULAR_DESTINATIONS = [
  // 아시아
  { id: 1, name: '도쿄', country: '일본', searchQuery: 'Tokyo' },
  { id: 2, name: '교토', country: '일본', searchQuery: 'Kyoto' },
  { id: 3, name: '방콕', country: '태국', searchQuery: 'Bangkok' },
  { id: 4, name: '치앙마이', country: '태국', searchQuery: 'Chiang Mai' },
  { id: 5, name: '발리', country: '인도네시아', searchQuery: 'Bali' },
  { id: 6, name: '싱가포르', country: '싱가포르', searchQuery: 'Singapore' },
  { id: 7, name: '타이베이', country: '대만', searchQuery: 'Taipei' },
  { id: 8, name: '하노이', country: '베트남', searchQuery: 'Hanoi' },
  { id: 9, name: '다낭', country: '베트남', searchQuery: 'Da Nang' },
  
  // 유럽
  { id: 10, name: '파리', country: '프랑스', searchQuery: 'Paris' },
  { id: 11, name: '런던', country: '영국', searchQuery: 'London' },
  { id: 12, name: '로마', country: '이탈리아', searchQuery: 'Rome' },
  { id: 13, name: '피렌체', country: '이탈리아', searchQuery: 'Florence' },
  { id: 14, name: '바르셀로나', country: '스페인', searchQuery: 'Barcelona' },
  { id: 15, name: '리스본', country: '포르투갈', searchQuery: 'Lisbon' },
  { id: 16, name: '프라하', country: '체코', searchQuery: 'Prague' },
  { id: 17, name: '인터라켄', country: '스위스', searchQuery: 'Interlaken' },
  { id: 18, name: '베를린', country: '독일', searchQuery: 'Berlin' },
  { id: 19, name: '이스탄불', country: '튀르키예', searchQuery: 'Istanbul' },
  
  // 아메리카
  { id: 20, name: '뉴욕', country: '미국', searchQuery: 'New York' },
  { id: 21, name: '로스앤젤레스', country: '미국', searchQuery: 'Los Angeles' },
  { id: 22, name: '밴쿠버', country: '캐나다', searchQuery: 'Vancouver' },
  { id: 23, name: '칸쿤', country: '멕시코', searchQuery: 'Cancun' },
  { id: 24, name: '부에노스아이레스', country: '아르헨티나', searchQuery: 'Buenos Aires' },
  
  // 오세아니아
  { id: 25, name: '시드니', country: '호주', searchQuery: 'Sydney' },
  { id: 26, name: '멜버른', country: '호주', searchQuery: 'Melbourne' },
  { id: 27, name: '퀸스타운', country: '뉴질랜드', searchQuery: 'Queenstown' },
  
  // 국내
  { id: 28, name: '서울', country: '대한민국', searchQuery: 'Seoul' },
  { id: 29, name: '부산', country: '대한민국', searchQuery: 'Busan' },
  { id: 30, name: '제주', country: '대한민국', searchQuery: 'Jeju' },
];

const PopularDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [destinationDetails, setDestinationDetails] = useState(null);

  // 초기 로드: 30개 도시의 Place ID를 autocomplete로 가져온 후 상세 정보 조회 (점진적 로딩)
  useEffect(() => {
    let cancelled = false;
    let firstLoaded = false;
    
    const fetchAllDestinations = async () => {
      setLoading(true);
      setDestinations([]); // 초기화
      
      const testDestinations = POPULAR_DESTINATIONS; // 전체 30개 처리
      
      // 🚀 점진적 로딩: 각 도시를 가져오는 즉시 화면에 표시
      for (const dest of testDestinations) {
        if (cancelled) return;
        
        try {
          const autocompleteRes = await fetch('/api/places/autocomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ q: dest.searchQuery })
          });

          if (!autocompleteRes.ok) throw new Error('Autocomplete failed');
          
          const autocompleteData = await autocompleteRes.json();
          const normalized = autocompleteData.normalizedSuggestions || [];
          
          if (normalized.length === 0) throw new Error('No results');
          
          const placeId = normalized[0].placeId;
          
          const detailsRes = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}`);
          if (!detailsRes.ok) throw new Error('Details fetch failed');
          
          const detailsData = await detailsRes.json();
          
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
          };
          
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
          };
          
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
      }
    };

    fetchAllDestinations();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // 카드 클릭 시 상세 정보 가져오기
  const handleCardClick = async (destination) => {
    setSelectedDestination(destination);
    setDetailsLoading(true);
    setDestinationDetails(null);

    try {
      const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(destination.placeId)}`);
      if (!response.ok) throw new Error('Failed to fetch details');

      const data = await response.json();
      
      setDestinationDetails({
        displayName: data.displayName?.text || destination.name,
        formattedAddress: data.formattedAddress || '',
        editorialSummary: data.editorialSummary?.text || '이 도시에 대한 설명이 제공되지 않습니다.',
        photos: data.photos || [],
      });
    } catch (error) {
      console.error('Failed to fetch destination details:', error);
      setDestinationDetails({
        displayName: destination.name,
        formattedAddress: '',
        editorialSummary: '상세 정보를 불러올 수 없습니다.',
        photos: [],
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedDestination(null);
    setDestinationDetails(null);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-3"> 여행지</h2>
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
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-3"> 여행지</h2>
          <p className="text-gray-600 text-lg">전 세계에서 가장 사랑받는 여행지를 둘러보세요</p>
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
                    <p className="text-gray-700 leading-relaxed">
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
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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

