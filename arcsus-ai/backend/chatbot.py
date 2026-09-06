"""
ARCSUS AI v3.4 - Custom AIML Parser
Auto-load semua file .aiml di folder
"""

import os
import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Tuple


class AIMLParser:
    """Parser AIML kustom"""
    
    def __init__(self):
        self.patterns: Dict[str, str] = {}
        self.wildcard_patterns: List[Tuple[re.Pattern, str]] = []
        self.total_loaded = 0
    
    def clean_text(self, text: str) -> str:
        """Bersihkan teks"""
        if not text:
            return ""
        text = text.upper()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def load_file(self, filepath: str) -> int:
        """Load satu file AIML"""
        count = 0
        
        try:
            tree = ET.parse(filepath)
            root = tree.getroot()
            
            for category in root.findall('.//category'):
                pattern_elem = category.find('pattern')
                template_elem = category.find('template')
                
                if pattern_elem is None or template_elem is None:
                    continue
                
                pattern_text = pattern_elem.text
                template_text = template_elem.text
                
                if not pattern_text or not template_text:
                    continue
                
                clean_pattern = self.clean_text(pattern_text)
                clean_template = template_text.strip()
                
                if '*' in clean_pattern:
                    regex_pattern = clean_pattern.replace('*', '(.+)')
                    regex_pattern = f'^{regex_pattern}$'
                    try:
                        compiled = re.compile(regex_pattern)
                        self.wildcard_patterns.append((compiled, clean_template))
                    except re.error:
                        pass
                else:
                    self.patterns[clean_pattern] = clean_template
                
                count += 1
            
            print(f"   ✅ Berhasil memuat {count} pattern dari {os.path.basename(filepath)}")
            return count
            
        except Exception as e:
            print(f"   ❌ Error loading {filepath}: {e}")
            return 0
    
    def respond(self, message: str) -> str:
        """Cari jawaban dengan multiple strategies"""
        
        if not message or not message.strip():
            return "Silakan ketik pertanyaan Anda tentang arsitektur berkelanjutan."
        
        clean_msg = self.clean_text(message)
        words = set(clean_msg.split())
        
        # STRATEGY 1: Exact Match
        if clean_msg in self.patterns:
            return self.patterns[clean_msg]
        
        # STRATEGY 2: Wildcard Match
        for regex, template in self.wildcard_patterns:
            match = regex.match(clean_msg)
            if match:
                return template
        
        # STRATEGY 3: Contains Match
        for pattern, template in self.patterns.items():
            if clean_msg in pattern or pattern in clean_msg:
                return template
        
        # STRATEGY 4: Word Overlap
        best_match = None
        best_score = 0
        
        for pattern, template in self.patterns.items():
            pattern_words = set(pattern.split())
            overlap = len(words & pattern_words)
            
            if len(words) > 0 and len(pattern_words) > 0:
                score = overlap / max(len(words), len(pattern_words))
            else:
                score = 0
            
            if overlap >= 2 and score > best_score:
                best_score = score
                best_match = template
        
        if best_match and best_score >= 0.5:
            return best_match
        
        return "Maaf, saya belum memahami. Coba tanyakan: 'APA ITU SUSTAINABLE ARCHITECTURE' atau 'APA ITU GREEN BUILDING'."
    
    def get_stats(self) -> Dict:
        return {
            'exact_patterns': len(self.patterns),
            'wildcard_patterns': len(self.wildcard_patterns),
            'total': self.total_loaded
        }


class ArcsusChatbot:
    """Chatbot utama"""
    
    def __init__(self):
        print("\n" + "="*70)
        print("🤖 MEMULAI INISIALISASI ARCSUS AI...")
        print("="*70)
        
        self.engine = AIMLParser()
        self.patterns_loaded = 0
        self._load_all_aiml_files()
        
        print(f"\n🎯 Chatbot siap dengan {self.patterns_loaded} patterns!")
        print("="*70 + "\n")
    
    def _load_all_aiml_files(self):
        """AUTO-LOAD semua file AIML"""
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            aiml_dir = os.path.abspath(os.path.join(current_dir, '..', 'aiml'))
            
            print(f"\n📁 AIML Directory: {aiml_dir}")
            print(f"✅ Folder exists: {os.path.isdir(aiml_dir)}\n")
            
            if not os.path.isdir(aiml_dir):
                print("❌ FATAL: Folder 'aiml' tidak ditemukan!")
                return
            
            aiml_files = sorted([
                f for f in os.listdir(aiml_dir) 
                if f.endswith('.aiml')
            ])
            
            print(f"📂 Ditemukan {len(aiml_files)} file AIML:")
            for f in aiml_files:
                print(f"   - {f}")
            print()
            
            if len(aiml_files) == 0:
                print("⚠️ Tidak ada file .aiml di folder!")
                return
            
            total = 0
            for filename in aiml_files:
                filepath = os.path.join(aiml_dir, filename)
                print(f"📄 Loading: {filename}...")
                count = self.engine.load_file(filepath)
                total += count
            
            self.patterns_loaded = total
            self.engine.total_loaded = total
            
            print(f"\n{'='*70}")
            print(f"📊 TOTAL PATTERNS LOADED: {total}")
            print(f"{'='*70}\n")
            
        except Exception as e:
            print(f"❌ ERROR KRITIS: {e}")
            import traceback
            traceback.print_exc()
    
    def get_response(self, message: str) -> str:
        return self.engine.respond(message)
    
    def get_health(self) -> Dict:
        return {
            'status': 'healthy',
            'bot_name': 'Arcsus AI',
            'version': '3.4.0',
            'total_patterns': self.patterns_loaded,
            'aiml_loaded': self.patterns_loaded > 0,
            'stats': self.engine.get_stats()
        }


print("\n📦 Memuat modul chatbot...")
chatbot = ArcsusChatbot()