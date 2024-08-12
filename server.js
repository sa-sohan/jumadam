const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const moment = require('moment-timezone');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001;

// 절대 경로 설정
const basePath = path.join(__dirname); // __dirname은 현재 파일의 디렉토리를 가리킵니다.

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(basePath, 'uploads')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(basePath, 'uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const readAnswers = async () => {
    try {
        const data = await fs.readFile(path.join(basePath, 'answers.json'), 'utf-8');
        return data.trim().split('\n').map(JSON.parse);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};

const auth = {
    username: process.env.ADMIN_USERNAME || 'sasohan',
    password: process.env.ADMIN_PASSWORD || '!Qq96521'
};

const requireLogin = (req, res, next) => {
    if (req.session.loggedIn) {
        next();
    } else {
        res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
};

app.get('/questions', (req, res) => {
    const questions = [
        "유휴~우리 친구 안녕? 쓸쓸해보이는 걸? 내가 소개팅 한번 해줄까~?",
        "좋아, 그럼 친구는 이름이 어떻게 돼? 그 누구도 친구의 이름을 알 수 없으니까 실명으로 말해주기야~?",
        "그렇구나~ 그럼 친구가 원하는 상대방의 지역은 어디일까?",
        "소개해주기 쉬운 지역인 걸~? 오케이, 그럼 몇년생이야~?",
        "오호 그렇구나? 친구는 남자야? 여자야?",
        "이제 끝났어~내가 상대방을 찾아서 프로필을 줄건데, 연락처 하나만 남겨줄래~? 오직 카카오톡으로만 보내고 있으니 부담갖지 말고 :)",
        "마지막으로 연상, 연하, 동갑중에 어떤 게 마음에 들어~?"
    ];
    res.json(questions);
});

app.get('/fortune-questions', (req, res) => {
    const fortuneQuestions = [
        "유후~우리 친구~내가 사주 한번 봐줄까?",
        "좋아~친구 이름은 어떻게 돼?",
        "좋은 이름이네~친구는 남자야? 여자야?",
        "그래? 그럼 출생년도가 언제지~?",
        "오케이~그럼 생일은~?",
        "오호~마지막으로 태어난 시간은~?"
    ];
    res.json(fortuneQuestions);
});

app.get('/mbti-questions', (req, res) => {
    const mbtiQuestions = [
        {
            question: "친구야~ MBTI 테스트 해볼래? 첫 번째 질문이야. 파티에 가면 어떤 편이야?",
            choices: ["새로운 사람들과 적극적으로 대화를 나눠요", "친한 친구들과 조용히 대화를 나누는 편이에요"]
        },
        {
            question: "두 번째 질문! 일할 때 어떤 스타일이야?",
            choices: ["체계적으로 계획을 세우고 그대로 진행해요", "상황에 따라 유연하게 대처하는 편이에요"]
        },
        {
            question: "세 번째! 결정을 내릴 때 주로 어떻게 해?",
            choices: ["논리적으로 분석해서 결정해요", "내 감정과 가치관에 따라 결정하는 편이에요"]
        },
        {
            question: "마지막 질문이야! 새로운 아이디어를 떠올릴 때 어때?",
            choices: ["현실적이고 구체적인 아이디어를 좋아해요", "창의적이고 새로운 아이디어를 좋아하는 편이에요"]
        }
    ];
    res.json(mbtiQuestions);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === auth.username && password === auth.password) {
        req.session.loggedIn = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: '잘못된 인증 정보입니다.' });
    }
});

app.get('/admin.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/design.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'design.html'));
});

app.get('/home_design.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home_design.html'));
});

app.post('/saveDesign', requireLogin, upload.fields([
    { name: 'background-image', maxCount: 1 },
    { name: 'logo-image', maxCount: 1 },
    { name: 'character-image-1', maxCount: 1 },
    { name: 'character-image-2', maxCount: 1 },
    { name: 'character-image-3', maxCount: 1 },
    { name: 'character-image-4', maxCount: 1 },
    { name: 'character-image-5', maxCount: 1 },
    { name: 'character-image-6', maxCount: 1 },
    { name: 'character-image-7', maxCount: 1 }
]), async (req, res) => {
    try {
        const designData = {
            font: req.body['font-select'],
            textColor: req.body['text-color'],
            backgroundImage: req.files['background-image'] ? req.files['background-image'][0].filename : undefined,
            logoImage: req.files['logo-image'] ? req.files['logo-image'][0].filename : undefined,
            characterImages: {}
        };

        for (let i = 1; i <= 7; i++) {
            const fieldName = `character-image-${i}`;
            if (req.files[fieldName]) {
                designData.characterImages[i] = req.files[fieldName][0].filename;
            }
        }

        await fs.writeFile('design.json', JSON.stringify(designData), 'utf-8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving design:', error);
        res.status(500).json({ success: false, message: '디자인 저장 중 오류가 발생했습니다.' });
    }
});

app.post('/saveHomeDesign', requireLogin, upload.fields([
    { name: 'home-character-image', maxCount: 1 }
]), async (req, res) => {
    try {
        const homeDesignData = {
            characterImage: req.files['home-character-image'] ? req.files['home-character-image'][0].filename : undefined,
            speechBubbleText: req.body['speech-bubble-text']
        };

        await fs.writeFile('home_design.json', JSON.stringify(homeDesignData), 'utf-8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving home design:', error);
        res.status(500).json({ success: false, message: '홈 디자인 저장 중 오류가 발생했습니다.' });
    }
});

app.post('/saveAnswers', [
    body('1').matches(/^[가-힣]{2,4}$/).withMessage('이름은 최소 두글자부터 최대 네글자까지 한글로만 입력이 가능해요'),
    body('2').isIn(['서울', '인천', '대전', '세종', '광주', '대구', '울산', '부산', '경기', '강원', '충북', '충남', '전남', '전북', '경북', '경남', '제주']).withMessage('유효한 지역을 선택해주세요'),
    body('3').custom(value => {
        const validYears = ['05', '04', '03', '02', '01', '00', '99', '98', '97', '96', '95', '94', '93', '92', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80'];
        if (!validYears.includes(value)) {
            throw new Error('아쉽지만 05년생부터 80년생까지만 신청이 가능해요 :)');
        }
        return true;
    }),
    body('4').isIn(['남자', '여자']).withMessage('성별을 정확히 입력해주세요'),
    body('5').matches(/^010\d{8}$/).withMessage('연락처는 010으로 시작하는 11자리까지만 입력이 가능해요'),
    body('6').isIn(['연상', '연하', '동갑']).withMessage('유효한 답변을 선택해주세요')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const answers = req.body;
        const timestamp = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
        answers[0] = '예'; // 첫 번째 답변을 '예'로 설정
        answers.push(timestamp);
        
        const existingAnswers = await readAnswers();
        existingAnswers.push(answers);
        
        await fs.writeFile('answers.json', existingAnswers.map(JSON.stringify).join('\n') + '\n');
        res.status(200).json({ message: '답변이 저장되었습니다.' });
    } catch (error) {
        console.error('Error saving answers:', error);
        res.status(500).json({ message: '답변 저장 중 오류가 발생했습니다.' });
    }
});

app.post('/saveFortuneAnswers', async (req, res) => {
    try {
        const answers = req.body;
        const timestamp = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
        answers.push(timestamp);
        
        const existingAnswers = await readAnswers();
        existingAnswers.push(answers);
        
        await fs.writeFile('fortune_answers.json', existingAnswers.map(JSON.stringify).join('\n') + '\n');
        
        // 사주팔자 결과 생성
        const fortuneResult = generateFortuneResult(answers);
        
        res.status(200).json({ message: '답변이 저장되었습니다.', fortuneResult: fortuneResult });
    } catch (error) {
        console.error('Error saving fortune answers:', error);
        res.status(500).json({ message: '답변 저장 중 오류가 발생했습니다.' });
    }
});

app.post('/saveMBTIAnswers', async (req, res) => {
    try {
        const answers = req.body;
        const timestamp = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
        answers.push(timestamp);
        
        const existingAnswers = await readAnswers();
        existingAnswers.push(answers);
        
        await fs.writeFile('mbti_answers.json', existingAnswers.map(JSON.stringify).join('\n') + '\n');
        
        // MBTI 결과 생성
        const mbtiResult = generateMBTIResult(answers);
        
        if (!mbtiResult) {
            throw new Error('MBTI 결과를 생성할 수 없습니다.');
        }
        
        res.status(200).json({ message: '답변이 저장되었습니다.', mbtiResult: mbtiResult });
    } catch (error) {
        console.error('Error saving MBTI answers:', error);
        res.status(500).json({ message: 'MBTI 답변 저장 중 오류가 발생했습니다.', error: error.message });
    }
});

function generateFortuneResult(answers) {
    const name = answers[1];
    const gender = answers[2];
    const birthYear = parseInt(answers[3]);
    const birthDate = answers[4];
    const birthTime = answers[5];

    let result = `${name} 친구~ 사주 결과야~ 한번 확인해봐~\n\n`;

    // 성별에 따른 운세
    if (gender === "남자에요") {
        result += "우와~ 남자 친구구나? 강인한 기운과 리더십이 넘치는 걸~ 주변 사람들한테 신뢰받을 수 있는 멋진 사람이 될 거야! ";
    } else {
        result += "우와~ 여자 친구구나? 섬세한 직관력과 공감 능력이 뛰어난 걸~ 주변 사람들의 마음을 잘 이해하고 화목한 분위기를 만들 수 있겠어! ";
    }

    // 출생년도에 따른 운세
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear + 1;
    if (age < 20) {
        result += "아직 젊은 친구구나~ 열정과 가능성이 넘치는 시기야! 새로운 도전을 두려워하지 말고 다양한 경험을 쌓아봐~ ";
    } else if (age < 30) {
        result += "20대구나~ 자신의 길을 찾아가는 중요한 시기야! 강점을 발견하고 키워나가는 게 좋을 거야~ ";
    } else if (age < 40) {
        result += "30대구나~ 경력이랑 인간관계에서 안정을 찾아가는 시기네~ 지금까지 쌓은 경험을 바탕으로 더 크게 성장할 수 있을 거야! ";
    } else if (age < 50) {
        result += "40대구나~ 인생의 전환점이 될 수 있는 시기야~ 지금까지의 삶을 돌아보고 앞으로의 방향을 새롭게 정해보는 건 어때? ";
    } else {
        result += "50대 이상이구나~ 풍부한 경험을 바탕으로 주변에 좋은 영향을 줄 수 있는 시기야! 젊은 세대한테 멋진 조언자가 되어줄 수 있을 거야~ ";
    }

    // 생일에 따른 운세
    const [month, day] = birthDate.split('월 ');
    const birthMonth = parseInt(month);
    const birthDay = parseInt(day);
    if (birthMonth >= 3 && birthMonth <= 5) {
        result += "봄에 태어났구나~ 새로운 시작과 성장의 기운을 타고났어! 창의적인 아이디어가 넘치고 변화를 두려워하지 않는 멋진 친구일 거야~ ";
    } else if (birthMonth >= 6 && birthMonth <= 8) {
        result += "여름에 태어났구나~ 열정과 활력이 넘치는 성격일 거야! 사교성도 좋아서 인간관계도 술술 잘 풀릴 거야~ ";
    } else if (birthMonth >= 9 && birthMonth <= 11) {
        result += "가을에 태어났구나~ 풍요롭고 안정적인 걸 좋아하는 편일 거야! 신중하고 분석적인 성격이라 깊이 있는 생각을 잘 하겠어~ ";
    } else {
        result += "겨울에 태어났구나~ 강인한 의지와 인내력을 가졌을 거야! 어려운 상황에서도 꿋꿋이 자신의 길을 갈 수 있는 힘이 있을 거야~ ";
    }

    // 태어난 시간에 따른 운세
    if (birthTime.includes("자시") || birthTime.includes("축시")) {
        result += "밤에 태어난 친구구나~ 신비로운 매력과 깊은 통찰력을 가졌을 거야! 예술이나 심리 분야에서 재능을 발휘할 수 있을 것 같아~";
    } else if (birthTime.includes("인시") || birthTime.includes("묘시")) {
        result += "새벽에 태어난 친구구나~ 선구자적인 기질과 창의성이 넘칠 거야! 남들이 안 간 길을 개척하는 데 두려움이 없을 것 같아~";
    } else if (birthTime.includes("진시") || birthTime.includes("사시")) {
        result += "오전에 태어난 친구구나~ 활동적이고 긍정적인 에너지가 넘칠 거야! 목표를 향해 꾸준히 나아가는 힘이 있어서 성공할 수 있을 것 같아~";
    } else if (birthTime.includes("오시") || birthTime.includes("미시")) {
        result += "정오에 태어난 친구구나~ 강한 의지와 리더십이 있을 거야! 주변 사람들에게 좋은 영향을 주고 조직을 이끌어갈 수 있는 재능이 있을 것 같아~";
    } else if (birthTime.includes("신시") || birthTime.includes("유시")) {
        result += "오후에 태어난 친구구나~ 균형 잡힌 사고와 조화로운 인간관계를 가질 수 있을 거야! 갈등을 잘 해결하고 화합을 이끌어내는 능력이 뛰어날 것 같아~";
    } else if (birthTime.includes("술시") || birthTime.includes("해시")) {
        result += "저녁에 태어난 친구구나~ 깊이 있는 통찰력과 예술적 감각을 지녔을 거야! 감성이 풍부해서 예술 분야에서 두각을 나타낼 수 있을 것 같아~";
    } else {
        result += "와~ 특별한 시간에 태어난 것 같아! 네 안에 숨겨진 특별한 재능이 있을 거야~ 자신의 내면을 잘 들여다보고 그 재능을 찾아보는 건 어때?";
    }

    result += "\n\n2024년의 운세도 한번 볼까?\n";
    result += "올해는 네게 변화와 성장의 해가 될 것 같아! ";
    result += birthMonth <= 6 
        ? "특히 상반기에 새로운 기회들이 많이 올 것 같으니까 잘 잡아봐~ " 
        : "하반기에 그동안 노력한 게 결실을 맺을 수 있을 것 같아! 기대해도 좋을 거야~ ";
    result += birthDay <= 15 
        ? "새로운 인연을 만나서 인생의 전환점이 될 수도 있을 것 같아! " 
        : "오래된 인연들과의 관계가 더 돈독해질 수 있을 거야~ 그 사람들을 소중히 여기는 게 좋을 것 같아! ";
    result += age < 40 
        ? "건강에도 신경 쓰고 규칙적으로 운동도 해서 체력을 키워보는 건 어때? " 
        : "건강 관리에 특히 신경 쓰고, 정기적으로 검진도 받아보는 게 좋을 것 같아~ ";
    result += birthMonth % 2 === 0 
        ? "금전적으로는 안정을 찾을 수 있는 해일 것 같아~ 하지만 무리한 투자는 조심해야 할 거야! " 
        : "새로운 투자 기회가 올 수도 있을 것 같아~ 하지만 신중히 검토해보고 결정하는 게 좋을 거야! ";
    result += birthYear % 2 === 0 
        ? "전반적으로 안정적이고 차분한 한 해가 될 것 같아~ " 
        : "변화와 도전의 기회가 많은 한 해가 될 것 같아! ";
        result += "자신을 믿고 꾸준히 노력한다면 좋은 결과를 얻을 수 있을 거야! 파이팅!";

        return result;
    }
    
    function generateMBTIResult(answers) {
        let type = "";
        type += answers[0].startsWith("새로운 사람들과") ? "E" : "I";
        type += answers[3].startsWith("현실적이고") ? "S" : "N";
        type += answers[2].startsWith("논리적으로") ? "T" : "F";
        type += answers[1].startsWith("체계적으로") ? "J" : "P";
    
        const descriptions = {
            "ISTJ": "신중하고 조용하며 집중력과 실천력이 높은 편이야.",
            "ISFJ": "차분하고 친근하며 책임감이 강하고 동정심이 많은 편이야.",
            "INFJ": "인내심이 많고 통찰력이 뛰어나며 화합을 추구하시는 편이야.",
            "INTJ": "독창적이고 분석력이 뛰어나며 내적 신념이 강한 편이야.",
            "ISTP": "조용하고 과묵하지만 손재주가 뛰어나고 응용력이 좋은 편이야.",
            "ISFP": "따뜻한 감성을 지니고 있고 겸손하고 헌신적인 편이야.",
            "INFP": "이상주의적이고 적응력이 높으며 정열적인 편이야.",
            "INTP": "논리적이고 분석적이며 풍부한 아이디어를 갖고 있는 편이야.",
            "ESTP": "활동적이고 적응력이 뛰어나며 현실적인 편이야.",
            "ESFP": "사교적이고 활발하며 수용력이 높은 편이야.",
            "ENFP": "열정적이고 창의적이며 항상 새로운 가능성을 찾는 편이야.",
            "ENTP": "독창적이고 분석적이며 새로운 도전을 즐기는 편이야.",
            "ESTJ": "현실감각이 뛰어나고 체계적이며 지도력이 있는 편이야.",
            "ESFJ": "동정심이 많고 개방적이며 인화를 중시하는 편이야.",
            "ENFJ": "참을성이 많고 이해심이 많으며 능동적인 편이야.",
            "ENTJ": "철저하고 논리적이며 지도력과 통솔력이 있는 편이야."
        };
    
        const famousPeople = {
            "ISTJ": ["앙겔라 메르켈", "조지 워싱턴"],
            "ISFJ": ["테레사 수녀", "케이트 미들턴"],
            "INFJ": ["넬슨 만델라", "마틴 루터 킹 주니어"],
            "INTJ": ["일론 머스크", "마크 주커버그"],
            "ISTP": ["스티브 잡스", "베어 그릴스"],
            "ISFP": ["마이클 잭슨", "프리다 칼로"],
            "INFP": ["윌리엄 셰익스피어", "톨킨"],
            "INTP": ["알베르트 아인슈타인", "빌 게이츠"],
            "ESTP": ["도널드 트럼프", "마돈나"],
            "ESFP": ["제이미 올리버", "엘렌 드제너러스"],
            "ENFP": ["로버트 다우니 주니어", "빌 클린턴"],
            "ENTP": ["스티브 워즈니악", "레오나르도 다 빈치"],
            "ESTJ": ["미셸 오바마", "샘 월튼"],
            "ESFJ": ["테일러 스위프트", "휴 잭맨"],
            "ENFJ": ["버락 오바마", "오프라 윈프리"],
            "ENTJ": ["스티브 발머", "고든 램지"]
        };
    
        return {
            type: type,
            description: descriptions[type] || `${type} 유형에 대한 설명을 찾을 수 없어요. 정말 독특한 분이시네요!`,
            famousPeople: famousPeople[type] || [`${type} 유형의 유명인을 찾을 수 없어요. 당신이 첫 번째 ${type} 유명인이 될 수 있어요!`]
        };
    }
    
    app.get('/getAnswers', requireLogin, async (req, res) => {
        try {
            const answers = await readAnswers();
            res.json(answers);
        } catch (error) {
            console.error('Error reading answers:', error);
            res.status(500).json({ message: '답변을 불러오는 중 오류가 발생했습니다.' });
        }
    });
    
    app.get('/getDesign', async (req, res) => {
        try {
            const data = await fs.readFile('design.json', 'utf-8');
            res.json(JSON.parse(data));
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.json({});
            } else {
                console.error('Error reading design:', error);
                res.status(500).json({ message: '디자인을 불러오는 중 오류가 발생했습니다.' });
            }
        }
    });
    
    app.get('/getHomeDesign', async (req, res) => {
        try {
            const data = await fs.readFile('home_design.json', 'utf-8');
            res.json(JSON.parse(data));
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.json({});
            } else {
                console.error('Error reading home design:', error);
                res.status(500).json({ message: '홈 디자인을 불러오는 중 오류가 발생했습니다.' });
            }
        }
    });
    
    app.delete('/deleteAnswer/:index', requireLogin, async (req, res) => {
        const index = parseInt(req.params.index, 10);
        try {
            const answers = await readAnswers();
            if (index >= 0 && index < answers.length) {
                answers.splice(index, 1);
                await fs.writeFile('answers.json', answers.map(JSON.stringify).join('\n') + '\n');
                res.json({ message: '답변이 삭제되었습니다.' });
            } else {
                res.status(404).json({ message: '해당 답변을 찾을 수 없습니다.' });
            }
        } catch (error) {
            console.error('Error deleting answer:', error);
            res.status(500).json({ message: '답변 삭제 중 오류가 발생했습니다.' });
        }
    });
    
    app.post('/saveDatingApplication', async (req, res) => {
        try {
            const { name, gender, region, birthYear, phone, timestamp } = req.body;
            const datingApplication = ['예', name, region, birthYear, gender, phone, '미선택', timestamp];
            
            const existingAnswers = await readAnswers();
            existingAnswers.push(datingApplication);
            
            await fs.writeFile('answers.json', existingAnswers.map(JSON.stringify).join('\n') + '\n');
            res.status(200).json({ message: '소개팅 신청이 저장되었습니다.' });
        } catch (error) {
            console.error('Error saving dating application:', error);
            res.status(500).json({ message: '소개팅 신청 저장 중 오류가 발생했습니다.' });
        }
    });
    
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });