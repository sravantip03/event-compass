
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  college TEXT,
  branch TEXT,
  year TEXT,
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  preferred_locations TEXT[] NOT NULL DEFAULT '{}',
  xp_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
GRANT SELECT ON public.profiles TO anon;

-- Auto-create profile + user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email, NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  organizer TEXT NOT NULL,
  college TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  mode TEXT NOT NULL CHECK (mode IN ('Online','Offline','Hybrid')),
  event_type TEXT NOT NULL,
  branch_tags TEXT[] NOT NULL DEFAULT '{}',
  tech_tags TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC(10,2) DEFAULT 0,
  prize_pool NUMERIC(12,2) DEFAULT 0,
  seats_left INT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  registration_url TEXT NOT NULL,
  official_website TEXT,
  image_url TEXT,
  popularity INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_start_date_idx ON public.events(start_date);
CREATE INDEX events_type_idx ON public.events(event_type);
CREATE INDEX events_city_idx ON public.events(city);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read approved" ON public.events FOR SELECT USING (is_approved = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "events admin insert" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "events admin update" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "events admin delete" ON public.events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Saved events
CREATE TABLE public.saved_events (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_events TO authenticated;
GRANT ALL ON public.saved_events TO service_role;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved own all" ON public.saved_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Applied events (click-through tracking)
CREATE TABLE public.applied_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','attended','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applied_events TO authenticated;
GRANT ALL ON public.applied_events TO service_role;
ALTER TABLE public.applied_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applied own all" ON public.applied_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  issuer TEXT,
  issue_date DATE,
  file_url TEXT,
  verification_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8),'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT SELECT ON public.certificates TO anon;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert public read" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "cert own write" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cert own update" ON public.certificates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cert own delete" ON public.certificates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Badges catalog
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INT NOT NULL DEFAULT 10
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges public read" ON public.badges FOR SELECT USING (true);

CREATE TABLE public.user_badges (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT SELECT ON public.user_badges TO anon;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges public read" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges own insert" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed badges
INSERT INTO public.badges (code,name,description,icon,xp_reward) VALUES
  ('first_event','First Event','Applied to your first event','Sparkles',10),
  ('hackathon_beginner','Hackathon Beginner','Applied to your first hackathon','Trophy',25),
  ('hackathon_explorer','Hackathon Explorer','Applied to 5 hackathons','Rocket',50),
  ('workshop_master','Workshop Master','Attended 5 workshops','GraduationCap',50),
  ('conference_enthusiast','Conference Enthusiast','Attended 3 conferences','Mic',40),
  ('ai_explorer','AI Explorer','Engaged with 3 AI events','Brain',40),
  ('ml_champion','ML Champion','Engaged with 5 ML events','Cpu',60),
  ('top_learner','Top Learner','Earned 3+ certificates','Award',80),
  ('century_club','100 XP Club','Reached 100 XP','Star',0),
  ('legend','500 XP Legend','Reached 500 XP','Crown',0);

-- Seed events (25)
INSERT INTO public.events (title,slug,description,short_description,organizer,college,city,state,latitude,longitude,mode,event_type,branch_tags,tech_tags,difficulty,is_free,price,prize_pool,seats_left,start_date,end_date,registration_deadline,registration_url,official_website,image_url,popularity,is_featured) VALUES
('Smart India Hackathon 2026','smart-india-hackathon-2026','A nationwide initiative to provide students a platform to solve some of the pressing problems we face in our daily lives, and thus inculcate a culture of product innovation.','India''s biggest hackathon powered by MoE','Ministry of Education','Multiple Colleges','New Delhi','Delhi',28.6139,77.2090,'Offline','Hackathon',ARRAY['Computer Science','AI','IT','ECE'],ARRAY['Python','Machine Learning','Web Development','Cloud'],'Advanced',true,0,10000000,50000,'2026-08-15 09:00+00','2026-08-16 21:00+00','2026-07-20 23:59+00','https://sih.gov.in','https://sih.gov.in','https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200',980,true),
('HackMIT 2026','hackmit-2026','MIT''s flagship 24-hour hackathon bringing together top students from around the world.','MIT''s flagship hackathon','MIT','MIT','Cambridge','MA',42.3601,-71.0942,'Offline','Hackathon',ARRAY['Computer Science','AI','Data Science'],ARRAY['Machine Learning','Deep Learning','Web Development'],'Advanced',true,0,25000,1000,'2026-09-14 08:00+00','2026-09-15 20:00+00','2026-08-30 23:59+00','https://hackmit.org','https://hackmit.org','https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',870,true),
('Google DevFest AI 2026','google-devfest-ai-2026','A community-led developer event focused on AI, ML, and Google technologies.','GDG''s largest AI event','Google Developer Groups','','Bangalore','Karnataka',12.9716,77.5946,'Hybrid','Conference',ARRAY['Computer Science','AI','Data Science'],ARRAY['Machine Learning','Deep Learning','Cloud','Python'],'Intermediate',true,0,0,2500,'2026-11-08 09:00+00','2026-11-08 18:00+00','2026-11-01 23:59+00','https://gdg.community.dev','https://gdg.community.dev','https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=1200',760,true),
('Full Stack Web Dev Bootcamp','full-stack-web-dev-bootcamp','8-week intensive bootcamp covering React, Node, Postgres, and deployment.','MERN + Postgres in 8 weeks','CodeChef','','Mumbai','Maharashtra',19.0760,72.8777,'Online','Bootcamp',ARRAY['Computer Science','IT'],ARRAY['Web Development','Java','Python'],'Beginner',false,999,0,300,'2026-08-01 10:00+00','2026-09-25 18:00+00','2026-07-25 23:59+00','https://codechef.com','https://codechef.com','https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200',540,false),
('MLH Local Hack Day: Build','mlh-local-hack-day-build','A day of building where students learn to hack, build, and collaborate.','MLH global hackathon day','Major League Hacking','','Global','',0,0,'Online','Hackathon',ARRAY['Computer Science','AI'],ARRAY['Web Development','Machine Learning','App Development'],'Beginner',true,0,5000,10000,'2026-10-12 12:00+00','2026-10-13 12:00+00','2026-10-10 23:59+00','https://mlh.io','https://mlh.io','https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200',650,true),
('Deep Learning Workshop with PyTorch','deep-learning-workshop-pytorch','Hands-on workshop to build and train deep neural networks using PyTorch.','Neural nets, hands-on','IIT Bombay','IIT Bombay','Mumbai','Maharashtra',19.1334,72.9133,'Offline','Workshop',ARRAY['Computer Science','AI','Data Science'],ARRAY['Deep Learning','Python','Machine Learning'],'Intermediate',false,499,0,120,'2026-08-24 10:00+00','2026-08-24 17:00+00','2026-08-20 23:59+00','https://iitb.ac.in','https://iitb.ac.in','https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200',420,false),
('AWS Cloud Practitioner Bootcamp','aws-cloud-practitioner-bootcamp','Prepare for AWS CCP certification with live sessions and labs.','Get AWS certified','AWS User Group','','Hyderabad','Telangana',17.3850,78.4867,'Hybrid','Bootcamp',ARRAY['Computer Science','IT'],ARRAY['Cloud','DevOps'],'Beginner',false,1499,0,200,'2026-09-05 09:00+00','2026-09-19 18:00+00','2026-09-01 23:59+00','https://aws.amazon.com','https://aws.amazon.com','https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',380,false),
('Devfolio ETHIndia 2026','ethindia-2026','India''s largest Ethereum hackathon.','Web3 hackathon','Devfolio','','Bangalore','Karnataka',12.9716,77.5946,'Offline','Hackathon',ARRAY['Computer Science','AI'],ARRAY['Blockchain','Web Development'],'Advanced',true,0,5000000,2000,'2026-12-06 09:00+00','2026-12-08 21:00+00','2026-11-20 23:59+00','https://devfolio.co','https://ethindia.co','https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200',720,true),
('UI/UX Design Sprint','ui-ux-design-sprint','A 3-day sprint to design beautiful, usable products.','Design your product in 3 days','Design at IIT','IIT Delhi','New Delhi','Delhi',28.5449,77.1926,'Offline','Workshop',ARRAY['Computer Science','IT'],ARRAY['UI UX'],'Beginner',false,299,0,80,'2026-08-10 10:00+00','2026-08-12 18:00+00','2026-08-05 23:59+00','https://iitd.ac.in','https://iitd.ac.in','https://images.unsplash.com/photo-1561070791-2526d30994b8?w=1200',310,false),
('Cybersecurity CTF Championship','cybersecurity-ctf-championship','Capture the flag challenge for aspiring ethical hackers.','Hack the flag','CyberArk','','Pune','Maharashtra',18.5204,73.8567,'Online','Competition',ARRAY['Computer Science','IT'],ARRAY['Cyber Security'],'Advanced',true,0,150000,500,'2026-09-28 12:00+00','2026-09-29 12:00+00','2026-09-25 23:59+00','https://ctftime.org','https://ctftime.org','https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',290,false),
('Data Science with Python','data-science-with-python','Introduction to data analysis, visualization, and ML with Python.','Learn Pandas, NumPy, Sklearn','Kaggle','','Chennai','Tamil Nadu',13.0827,80.2707,'Online','Workshop',ARRAY['Computer Science','Data Science','AI'],ARRAY['Python','Data Science','Machine Learning'],'Beginner',true,0,0,1000,'2026-08-17 10:00+00','2026-08-17 17:00+00','2026-08-15 23:59+00','https://kaggle.com','https://kaggle.com','https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200',610,true),
('Flutter App Dev Weekend','flutter-app-dev-weekend','Build a full mobile app in a weekend using Flutter.','Ship an app in 48h','Flutter Bangalore','','Bangalore','Karnataka',12.9716,77.5946,'Hybrid','Workshop',ARRAY['Computer Science','IT'],ARRAY['App Development'],'Intermediate',false,199,0,150,'2026-09-21 09:00+00','2026-09-22 21:00+00','2026-09-18 23:59+00','https://flutter.dev','https://flutter.dev','https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200',270,false),
('AR/VR Innovation Summit','ar-vr-innovation-summit','A conference exploring the future of AR, VR, and spatial computing.','Future of spatial computing','XR India','','Gurgaon','Haryana',28.4595,77.0266,'Offline','Conference',ARRAY['Computer Science','ECE'],ARRAY['AR VR'],'Intermediate',false,799,0,400,'2026-10-05 09:00+00','2026-10-06 18:00+00','2026-09-30 23:59+00','https://xrindia.org','https://xrindia.org','https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1200',230,false),
('IoT Hackathon: Smart Cities','iot-hackathon-smart-cities','Build IoT solutions for the cities of tomorrow.','IoT + Smart Cities','Intel','','Bangalore','Karnataka',12.9716,77.5946,'Offline','Hackathon',ARRAY['ECE','Computer Science','EEE'],ARRAY['IoT','Cloud','Python'],'Intermediate',true,0,300000,300,'2026-11-15 09:00+00','2026-11-16 21:00+00','2026-11-10 23:59+00','https://intel.com','https://intel.com','https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',350,false),
('GenAI Tech Talk with OpenAI','genai-tech-talk-openai','A tech talk on the state of generative AI and future directions.','GenAI insights from OpenAI','OpenAI','','Online','',0,0,'Online','Tech Talk',ARRAY['Computer Science','AI','Data Science'],ARRAY['Machine Learning','Deep Learning'],'Beginner',true,0,0,5000,'2026-08-30 18:00+00','2026-08-30 20:00+00','2026-08-29 23:59+00','https://openai.com','https://openai.com','https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',890,true),
('Google Cloud Study Jam','google-cloud-study-jam','Hands-on Google Cloud labs and community learning.','Free GCP labs','GDG Cloud','','Hyderabad','Telangana',17.3850,78.4867,'Online','Workshop',ARRAY['Computer Science','IT'],ARRAY['Cloud','DevOps'],'Beginner',true,0,0,3000,'2026-09-12 10:00+00','2026-09-12 17:00+00','2026-09-10 23:59+00','https://cloud.google.com','https://cloud.google.com','https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200',420,false),
('Robotics Bootcamp with ROS','robotics-bootcamp-ros','Learn Robot Operating System (ROS) fundamentals.','Build a robot in 2 weeks','IIT Kanpur','IIT Kanpur','Kanpur','Uttar Pradesh',26.5123,80.2329,'Hybrid','Bootcamp',ARRAY['Mechanical','ECE','Computer Science'],ARRAY['Python','IoT'],'Advanced',false,1999,0,60,'2026-09-01 09:00+00','2026-09-14 18:00+00','2026-08-28 23:59+00','https://iitk.ac.in','https://iitk.ac.in','https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200',180,false),
('Startup Pitch Competition','startup-pitch-competition','Pitch your startup idea and win seed funding.','Win seed funding','TiE Global','','Mumbai','Maharashtra',19.0760,72.8777,'Offline','Competition',ARRAY['MBA','Computer Science'],ARRAY['Web Development'],'Intermediate',true,0,1000000,200,'2026-10-19 09:00+00','2026-10-19 18:00+00','2026-10-10 23:59+00','https://tie.org','https://tie.org','https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200',260,false),
('Kaggle ML Competition Prep','kaggle-ml-competition-prep','Learn how to climb Kaggle leaderboards.','Kaggle grandmaster tips','Kaggle India','','Online','',0,0,'Online','Webinar',ARRAY['Computer Science','AI','Data Science'],ARRAY['Machine Learning','Python','Data Science'],'Intermediate',true,0,0,4000,'2026-09-07 19:00+00','2026-09-07 21:00+00','2026-09-06 23:59+00','https://kaggle.com','https://kaggle.com','https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=1200',390,false),
('Frontend Masters Workshop','frontend-masters-workshop','Advanced React patterns and performance.','Advanced React','Frontend Masters','','Online','',0,0,'Online','Workshop',ARRAY['Computer Science','IT'],ARRAY['Web Development'],'Advanced',false,599,0,500,'2026-08-28 18:00+00','2026-08-28 21:00+00','2026-08-27 23:59+00','https://frontendmasters.com','https://frontendmasters.com','https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',300,false),
('Blockchain Developer Bootcamp','blockchain-developer-bootcamp','Learn Solidity, smart contracts, and Web3.','Web3 from scratch','ConsenSys','','Bangalore','Karnataka',12.9716,77.5946,'Hybrid','Bootcamp',ARRAY['Computer Science','IT'],ARRAY['Blockchain'],'Intermediate',false,2499,0,100,'2026-09-15 09:00+00','2026-10-15 18:00+00','2026-09-10 23:59+00','https://consensys.net','https://consensys.net','https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=1200',210,false),
('DevOps with Kubernetes','devops-with-kubernetes','Containerization and orchestration with K8s.','K8s in production','Docker Community','','Pune','Maharashtra',18.5204,73.8567,'Online','Workshop',ARRAY['Computer Science','IT'],ARRAY['DevOps','Cloud'],'Advanced',false,899,0,200,'2026-10-22 10:00+00','2026-10-22 17:00+00','2026-10-20 23:59+00','https://docker.com','https://docker.com','https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200',240,false),
('Women in Tech Conference','women-in-tech-conference','A conference celebrating women in tech.','Amplify voices','Grace Hopper India','','Bangalore','Karnataka',12.9716,77.5946,'Hybrid','Conference',ARRAY['Computer Science','AI','Data Science','IT','ECE'],ARRAY['Machine Learning','Web Development','Cloud'],'Beginner',false,1299,0,1500,'2026-11-02 09:00+00','2026-11-03 18:00+00','2026-10-25 23:59+00','https://ghc.anitab.org','https://ghc.anitab.org','https://images.unsplash.com/photo-1573165706511-3ffde6f8b3b3?w=1200',470,true),
('Competitive Programming Contest','competitive-programming-contest','Solve algorithmic challenges to win.','Codeforces round','Codeforces India','','Online','',0,0,'Online','Competition',ARRAY['Computer Science','IT'],ARRAY['Java','Python'],'Advanced',true,0,50000,3000,'2026-08-20 19:00+00','2026-08-20 22:00+00','2026-08-20 18:00+00','https://codeforces.com','https://codeforces.com','https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200',360,false),
('AI in Healthcare Symposium','ai-in-healthcare-symposium','Explore how AI is transforming healthcare delivery.','AI x Healthcare','AIIMS','AIIMS','New Delhi','Delhi',28.5672,77.2100,'Offline','Conference',ARRAY['AI','Data Science','Computer Science'],ARRAY['Machine Learning','Deep Learning','Python'],'Intermediate',false,499,0,600,'2026-11-25 09:00+00','2026-11-25 18:00+00','2026-11-20 23:59+00','https://aiims.edu','https://aiims.edu','https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200',330,false);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
