import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { Message } from '../../shared/Message';
import { User } from '../../shared/User';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages implements OnInit, OnDestroy {
  recipientId: string | null = null;
  recipientUser?: User | null;
  newMessage = '';
  messages: Message[] = [];
  unSub?: () => void;
  remult = remult;
  conversations: any[] = [];
  filteredConversations: any[] = [];
  searchText = '';
  searchUserQuery = '';
  filteredUsers: User[] = [];
  showMenu = false;

  constructor(private route: ActivatedRoute, private router: Router, private zone: NgZone) {}

  async ngOnInit() {
    await this.loadConversations();

    this.route.paramMap.subscribe(async params => {
      this.recipientId = params.get('userId');
      if (this.recipientId) {
        this.recipientUser = await remult.repo(User).findId(this.recipientId);
        this.subscribeToMessages();
      }
    });
  }

  subscribeToMessages() {
    if (this.unSub) this.unSub();

    this.unSub = remult.repo(Message).liveQuery({
      where: {
        $or: [
          { senderId: remult.user!.id, recipientId: this.recipientId! },
          { senderId: this.recipientId!, recipientId: remult.user!.id }
        ]
      },
      orderBy: { createdAt: "asc" }
    }).subscribe(info => {
      this.zone.run(() => {
        // 1. Luăm mesajele oficiale venite de pe server
        const serverMessages = info.items;
        
        // 2. Filtram mesajele locale temporare: le păstrăm DOAR pe cele care 
        // nu au apucat încă să fie salvate pe server (verificăm duplicarea conținutului)
        const pendingTempMessages = this.messages.filter(m => 
          m.id.startsWith('temp-') && 
          !serverMessages.some(sm => sm.imageUrl === m.imageUrl && sm.senderId === m.senderId)
        );
        
        // 3. Combinăm listele (oficial + ce e încă în curs de trimitere)
        const allMessages = [...serverMessages, ...pendingTempMessages];
        
        // 4. Sortăm cronologic
        allMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        this.messages = allMessages;
        
        setTimeout(() => this.scrollToBottom(), 300);
      });
    });
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.recipientId) return;

    const textToSend = this.newMessage;
    this.newMessage = ''; 

    try {
      await remult.repo(Message).insert({
        id: Math.random().toString(36).substring(2, 11) + Date.now(),
        senderId: remult.user!.id,
        recipientId: this.recipientId,
        text: textToSend,
        createdAt: new Date()
      });
    } catch (error: any) {
      alert("Eroare: " + error.message);
      this.newMessage = textToSend; 
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const viewport = document.querySelector('.messages-viewport');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.unSub) this.unSub();
  }

  async loadConversations() {
    const allMessages = await remult.repo(Message).find({
      where: {
        $or: [
          { senderId: remult.user!.id },
          { recipientId: remult.user!.id }
        ]
      }
    });

    const partnerIds = new Set();
    allMessages.forEach(m => {
      if (m.senderId !== remult.user!.id) partnerIds.add(m.senderId);
      if (m.recipientId !== remult.user!.id) partnerIds.add(m.recipientId);
    });

    this.conversations = await remult.repo(User).find({
      where: { id: Array.from(partnerIds) as string[] }
    });
    
    // Initialize filter
    this.filteredConversations = this.conversations;
  }

  filterConversations() {
    this.filteredConversations = this.conversations.filter(c => 
      c.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  async onUserSearch() {
  if (!this.searchUserQuery.trim()) {
    this.filteredUsers = [];
    return;
  }
  const search = this.searchUserQuery.toLowerCase();
  // Fetch all users to search through
  const allUsers = await remult.repo(User).find();
  this.filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(search) && u.id !== remult.user?.id
  );
}

toggleConvMenu() {
  this.showMenu = !this.showMenu;
}

async deleteConversation(userId: string | null) {
  if (!userId || !confirm('Are you sure you want to delete this conversation?')) return;
  
  // Close menu
  this.showMenu = false;
  
  const messagesToDelete = await remult.repo(Message).find({
    where: {
      $or: [
        { senderId: remult.user!.id, recipientId: userId },
        { senderId: userId, recipientId: remult.user!.id }
      ]
    }
  });

  for (const msg of messagesToDelete) {
    await remult.repo(Message).delete(msg);
  }
  
  // Reset view
  this.recipientId = null;
  await this.loadConversations();
}

startNewChat(userId: string) {
  this.searchUserQuery = '';
  this.filteredUsers = [];
  this.navigateToChat(userId);
}

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        
        if (img.width > MAX_WIDTH) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3);

        // Generăm un ID temporar unic
        const tempId = 'temp-' + Date.now();
        const tempMsg: Message = {
          id: tempId,
          senderId: remult.user!.id,
          recipientId: this.recipientId!,
          imageUrl: compressedBase64,
          text: '',
          createdAt: new Date()
        };

        // UI-ul reacționează instant pentru utilizator
        this.zone.run(() => {
          this.messages = [...this.messages, tempMsg];
          setTimeout(() => this.scrollToBottom(), 100);
        });

        try {
          await remult.repo(Message).insert({
            id: Math.random().toString(36).substring(2, 15) + Date.now(),
            senderId: remult.user!.id,
            recipientId: this.recipientId!,
            imageUrl: compressedBase64,
            text: '',
            createdAt: new Date()
          });
        } catch (err) {
          console.error("The image could not be send:", err);
          this.zone.run(() => {
            this.messages = this.messages.filter(m => m.id !== tempId);
          });
        }
      };
    };
  }
  

  viewImage(url: string) {
    window.open(url, '_blank');
  }

  navigateToChat(userId: string) {
    this.router.navigate(['/messages', userId]);
  }
}