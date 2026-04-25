const BREEDS = [
  {
    korean: '래브라도 리트리버', english: 'Labrador Retriever',
    apiPath: 'retriever/labrador', wikiTitle: 'Labrador Retriever',
    description: '다정하고 활발한 성격의 인기 최고 견종이에요! 지능이 높아 안내견·구조견으로 활약하고, 물을 정말 좋아한답니다. 아이들과 잘 놀아주는 든든한 친구예요. 🌊',
  },
  {
    korean: '골든 리트리버', english: 'Golden Retriever',
    apiPath: 'retriever/golden', wikiTitle: 'Golden Retriever',
    description: '온순하고 친근한 성격으로 온 가족의 사랑을 받아요! 인내심이 강하고 공 가져오기를 정말 좋아한답니다. 황금빛 털이 정말 아름다운 견종이에요. 🎾',
  },
  {
    korean: '저먼 셰퍼드', english: 'German Shepherd',
    apiPath: 'germanshepherd', wikiTitle: 'German Shepherd',
    description: '용감하고 충성스러운 경찰견의 대표! 지능이 높아 훈련이 잘 되고, 주인을 위해서라면 무엇이든 하는 헌신적인 성격이에요. 🛡️',
  },
  {
    korean: '프렌치 불독', english: 'French Bulldog',
    apiPath: 'bulldog/french', wikiTitle: 'French Bulldog',
    description: '명랑하고 애교 넘치는 아파트 인기 1위! 운동을 많이 안 해도 되고, 귀여운 박쥐 귀가 특징이에요. 코골이를 하는 걸로도 유명해요. 😴',
  },
  {
    korean: '잉글리시 불독', english: 'English Bulldog',
    apiPath: 'bulldog/english', wikiTitle: 'Bulldog',
    description: '느긋하고 온순한 영국의 대표 견종이에요! 용감하지만 공격적이지 않아 아이들과 잘 어울려요. 주름진 얼굴이 매력 포인트랍니다. 😎',
  },
  {
    korean: '푸들', english: 'Poodle',
    apiPath: 'poodle', wikiTitle: 'Poodle',
    description: '지능이 매우 높은 멋쟁이 견종! 곱슬거리는 털은 알레르기가 적어서 좋아요. 소형·중형·대형 세 가지 크기로 있답니다. 💇',
  },
  {
    korean: '비글', english: 'Beagle',
    apiPath: 'beagle', wikiTitle: 'Beagle',
    description: '호기심 많고 활발한 사냥개 출신이에요! 후각이 아주 뛰어나서 냄새를 잘 맡아요. 커다란 눈과 긴 귀가 정말 귀엽죠? 👃',
  },
  {
    korean: '로트와일러', english: 'Rottweiler',
    apiPath: 'rottweiler', wikiTitle: 'Rottweiler',
    description: '자신감 있고 용감한 수호견이에요! 충성스럽고 보호 본능이 강하지만, 잘 훈련되면 아이들을 지키는 든든한 친구예요. 💪',
  },
  {
    korean: '닥스훈트', english: 'Dachshund',
    apiPath: 'dachshund', wikiTitle: 'Dachshund',
    description: '긴 몸통과 짧은 다리가 트레이드마크! 땅굴 속 오소리를 잡는 사냥개였어요. 호기심 많고 용감한 소시지 강아지예요. 🌭',
  },
  {
    korean: '웰시 코기', english: 'Welsh Corgi',
    apiPath: 'corgi/pembroke', wikiTitle: 'Pembroke Welsh Corgi',
    description: '영국 여왕님이 가장 사랑한 견종! 짧은 다리이지만 목장에서 소를 몰던 용감한 개예요. 복슬복슬한 엉덩이가 인기 포인트예요. 👑',
  },
  {
    korean: '요크셔 테리어', english: 'Yorkshire Terrier',
    apiPath: 'terrier/yorkshire', wikiTitle: 'Yorkshire Terrier',
    description: '작은 몸이지만 용감한 성격의 소형견! 실크처럼 부드러운 긴 털이 특징이에요. 에너지가 넘치고 호기심이 아주 많아요. ✨',
  },
  {
    korean: '복서', english: 'Boxer',
    apiPath: 'boxer', wikiTitle: 'Boxer (dog)',
    description: '장난기 많고 아이들을 사랑하는 견종! 충성스럽고 놀이를 정말 좋아해요. 근육질 몸매이지만 성격은 아주 다정하답니다. 🥊',
  },
  {
    korean: '시베리안 허스키', english: 'Siberian Husky',
    apiPath: 'husky', wikiTitle: 'Siberian Husky',
    description: '썰매를 끄는 강인한 북방의 개! 두꺼운 이중 털로 혹독한 추위를 견뎌요. 늑대처럼 하울링 소리를 내는 것으로 유명해요. 🐺',
  },
  {
    korean: '그레이트 데인', english: 'Great Dane',
    apiPath: 'dane/great', wikiTitle: 'Great Dane',
    description: '세계에서 가장 키가 큰 견종 중 하나! 큰 덩치와 달리 성격은 매우 온순하고 다정해요. 거대한 몸으로 소파를 독차지하기도 해요. 🦕',
  },
  {
    korean: '도베르만', english: 'Doberman',
    apiPath: 'doberman', wikiTitle: 'Dobermann',
    description: '날렵하고 지능이 높은 경비견! 충성스럽고 보호 본능이 강해요. 잘 훈련되면 아주 다정한 가족견이 된답니다. 🔒',
  },
  {
    korean: '시추', english: 'Shih Tzu',
    apiPath: 'shihtzu', wikiTitle: 'Shih Tzu',
    description: '중국 황실에서 사랑받은 귀족 강아지! 온순하고 사교적인 성격이에요. 복슬복슬한 털과 납작한 얼굴이 사랑스러워요. 🏯',
  },
  {
    korean: '보스턴 테리어', english: 'Boston Terrier',
    apiPath: 'terrier/boston', wikiTitle: 'Boston Terrier',
    description: '턱시도를 입은 것처럼 보이는 미국 대표 소형견! 명랑하고 친근한 성격으로 도시 생활에 잘 맞아요. 키우기 쉬운 편이에요. 🎩',
  },
  {
    korean: '포메라니안', english: 'Pomeranian',
    apiPath: 'pomeranian', wikiTitle: 'Pomeranian (dog)',
    description: '폭신폭신한 털뭉치 같은 소형견! 작은 몸이지만 개성이 강하고 용감해요. 활발하고 호기심이 가득하답니다. 🧁',
  },
  {
    korean: '하바네세', english: 'Havanese',
    apiPath: 'havanese', wikiTitle: 'Havanese dog',
    description: '쿠바의 국견으로 쾌활하고 애교쟁이! 사람을 매우 좋아해서 혼자 있는 걸 싫어해요. 실키한 긴 털이 우아하게 흘러내린답니다. 🌺',
  },
  {
    korean: '셔틀랜드 십독', english: 'Shetland Sheepdog',
    apiPath: 'sheepdog/shetland', wikiTitle: 'Shetland Sheepdog',
    description: '스코틀랜드에서 양을 몰던 영리한 목양견! 훈련 능력이 뛰어나 대회에서 자주 우승해요. 유명한 목양견의 소형 버전처럼 귀엽게 생겼어요. 🏅',
  },
  {
    korean: '보더 콜리', english: 'Border Collie',
    apiPath: 'collie/border', wikiTitle: 'Border Collie',
    description: '세계에서 지능이 가장 높은 개로 알려진 견종! 양몰이 본능이 강하고 에너지가 넘쳐요. 프리스비·어질리티 대회의 단골 챔피언이에요. 🧠',
  },
  {
    korean: '말티즈', english: 'Maltese',
    apiPath: 'maltese', wikiTitle: 'Maltese dog',
    description: '순백색 긴 털의 우아한 귀족 강아지! 수천 년의 역사를 가진 오래된 견종이에요. 온순하고 사랑스러운 성격으로 인기가 많아요. 👸',
  },
  {
    korean: '사모예드', english: 'Samoyed',
    apiPath: 'samoyed', wikiTitle: 'Samoyed (dog)',
    description: '항상 웃는 것처럼 보이는 하얀 솜사탕! 시베리아에서 썰매를 끌고 사냥을 돕던 견종이에요. 친근하고 장난기가 많아 인기 최고예요. ☁️',
  },
  {
    korean: '코커 스패니얼', english: 'Cocker Spaniel',
    apiPath: 'spaniel/cocker', wikiTitle: 'Cocker Spaniel',
    description: '아름다운 물결 털과 긴 귀가 매력적인 견종! 명랑하고 온순한 성격이에요. 사냥도 잘하고 가족과 잘 어울리는 만능견이랍니다. 🌊',
  },
  {
    korean: '치와와', english: 'Chihuahua',
    apiPath: 'chihuahua', wikiTitle: 'Chihuahua (dog)',
    description: '세계에서 가장 작은 견종! 작지만 용감하고 자신감이 넘쳐요. 주인에 대한 충성심이 매우 강하고 애교가 많답니다. 💖',
  },
];
