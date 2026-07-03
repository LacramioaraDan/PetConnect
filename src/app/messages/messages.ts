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

  // Loads the list of conversations when the component initializes
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

  // Subscribes to real-time updates for messages between the current user and the selected recipient
  subscribeToMessages() {
    if (this.unSub) this.unSub();

    // Live query to fetch messages between the current user and the selected recipient, ordered by creation time
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
        const serverMessages = info.items;
        
        // Identify any temporary messages that were sent but not yet confirmed by the server
        const pendingTempMessages = this.messages.filter(m => 
          m.id.startsWith('temp-') && 
          !serverMessages.some(sm => sm.imageUrl === m.imageUrl && sm.senderId === m.senderId)
        );
        
        const allMessages = [...serverMessages, ...pendingTempMessages];
        
        // Sort all messages by their creation time to ensure correct order in the chat view
        allMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        this.messages = allMessages;
        
        // Scroll to the bottom of the chat view after a short delay to ensure the latest messages are visible
        setTimeout(() => this.scrollToBottom(), 300);
      });
    });
  }

  // Sends a new message to the selected recipient, handling both text and image messages
  async sendMessage() {
    if (!this.newMessage.trim() || !this.recipientId) return;

    // Store the message text and clear the input field immediately for a responsive UI
    const textToSend = this.newMessage;
    this.newMessage = ''; 

    try {
      // Insert the new message into the database with a unique ID and the current timestamp
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

  // Scrolls the chat view to the bottom to ensure the latest messages are visible
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

  // Cleans up subscriptions when the message component is destroyed
  ngOnDestroy() {
    if (this.unSub) this.unSub();
  }

  // Loads all conversations for the current user, identifying unique conversation partners
  async loadConversations() {
    const allMessages = await remult.repo(Message).find({
      where: {
        $or: [
          { senderId: remult.user!.id },
          { recipientId: remult.user!.id }
        ]
      }
    });

    // Use a Set to collect unique partner IDs from the messages
    const partnerIds = new Set();
    allMessages.forEach(m => {
      if (m.senderId !== remult.user!.id) partnerIds.add(m.senderId);
      if (m.recipientId !== remult.user!.id) partnerIds.add(m.recipientId);
    });

    // Fetch user details for each unique conversation partner to display in the conversation list
    this.conversations = await remult.repo(User).find({
      where: { id: Array.from(partnerIds) as string[] }
    });
    
    this.filteredConversations = this.conversations;
  }

  // Filters the list of conversations based on the search text entered by the user
  filterConversations() {
    this.filteredConversations = this.conversations.filter(c => 
      c.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // Searches for users based on the search query, excluding the current user from the results
  async onUserSearch() {
    if (!this.searchUserQuery.trim()) {
      this.filteredUsers = [];
      return;
    }
    // Convert the search query to lowercase for case-insensitive matching
    const search = this.searchUserQuery.toLowerCase();
    const allUsers = await remult.repo(User).find();
    this.filteredUsers = allUsers.filter(u => 
      u.name?.toLowerCase().includes(search) && u.id !== remult.user?.id
    );
  }

  // Toggles the visibility of the conversation menu for actions like deleting a conversation
  toggleConvMenu() {
    this.showMenu = !this.showMenu;
  }

  // Deletes the entire conversation with a specific user after confirming with the current user
  async deleteConversation(userId: string | null) {
    if (!userId || !confirm('Are you sure you want to delete this conversation?')) return;
    
    this.showMenu = false;
    
    // Fetch all messages between the current user and the specified user to delete them
    const messagesToDelete = await remult.repo(Message).find({
      where: {
        $or: [
          { senderId: remult.user!.id, recipientId: userId },
          { senderId: userId, recipientId: remult.user!.id }
        ]
      }
    });

    // Delete each message in the conversation from the database
    for (const msg of messagesToDelete) {
      await remult.repo(Message).delete(msg);
    }
    
    // Clear the current recipient and reload the conversation list to reflect the deletion
    this.recipientId = null;
    await this.loadConversations();
  }

  // Starts a new chat with a specific user by clearing the search query and navigating to the chat view
  startNewChat(userId: string) {
    this.searchUserQuery = '';
    this.filteredUsers = [];
    this.navigateToChat(userId);
  }

  // Handles the selection of an image file for sending in the chat, compressing it before sending
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Create a FileReader to read the selected image file as a data URL
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      
      // Once the image is loaded, compress it and send it as a message
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Define a maximum width for the image to ensure it is not too large for sending
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        
        // Resize the canvas based on the image dimensions and the defined maximum width
        if (img.width > MAX_WIDTH) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        // Draw the image onto the canvas and compress it to a JPEG format with reduced quality for faster sending
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3);

        // Create a temporary message object to display the image in the chat immediately while waiting for server confirmation
        const tempId = 'temp-' + Date.now();
        const tempMsg: Message = {
          id: tempId,
          senderId: remult.user!.id,
          recipientId: this.recipientId!,
          imageUrl: compressedBase64,
          text: '',
          createdAt: new Date()
        };

        // Update the chat messages in the UI to include the temporary message and scroll to the bottom of the chat view
        this.zone.run(() => {
          this.messages = [...this.messages, tempMsg];
          setTimeout(() => this.scrollToBottom(), 100);
        });

        // Attempt to send the image message to the server, and handle any errors that may occur during the process
        try {
          await remult.repo(Message).insert({
            id: Math.random().toString(36).substring(2, 15) + Date.now(),
            senderId: remult.user!.id,
            recipientId: this.recipientId!,
            imageUrl: compressedBase64,
            text: '',
            createdAt: new Date()
          });

          // Once the message is successfully sent, remove the temporary message from the UI to avoid duplicates
        } catch (err) {
          console.error("The image could not be sent:", err);
          this.zone.run(() => {
            this.messages = this.messages.filter(m => m.id !== tempId);
          });
        }
      };
    };
  }
  
  // Opens the selected image in a new browser tab for better viewing
  viewImage(url: string) {
    window.open(url, '_blank');
  }

  // Navigates to the chat view for a specific user by updating the route parameters
  navigateToChat(userId: string) {
    this.router.navigate(['/messages', userId]);
  }
}