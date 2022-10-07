<template>
  <div class="about">
    <h2>1. Start your Webcam</h2>
    <div class="videos">
      <span>
        <h3>Local Stream</h3>
        <video id="webcamVideo" autoplay playsinline :srcObject="webcamVideoSource"></video>
      </span>
      <span>
        <h3>Remote Stream</h3>
        <video id="remoteVideo" autoplay playsinline :srcObject="remoteVideoSource"></video>
      </span>

    </div>

    <button id="webcamButton" @click="start_webcam">Start webcam</button>
    <h2>2. Create a new Call</h2>
    <button id="callButton" @click="create_call">Create Call (offer)</button>

    <h2>3. Join a Call</h2>
    <p>Answer the call from a different browser window or device</p>

    <input id="callInput" v-model="callInputValue"/>
    <button id="answerButton" @click="answer_call">Answer</button>

    <h2>4. Hangup</h2>

    <button id="hangupButton" @click="hangup_call">Hangup</button>

      </div>
</template>

<script>

/* eslint-disable */
import firebase from '@/helpers/firebase'
import { connectStorageEmulator } from '@firebase/storage';
import { doc, deleteDoc } from "firebase/firestore";



export default {
  data () {
    return {
      localStream: null,
      remoteStream: null,
      webcamVideoSource: null,
      remoteVideoSource: null,
      pc: new RTCPeerConnection(this.servers),
      callInputValue: "",
      firestore: null,
      servers: {
        iceServers: [
          {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
          }
        ],
        iceCandidatePoolSize: 10
      }    
    }
  },
  methods: {

    async start_webcam() {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.remoteStream = new MediaStream();

      // Push tracks from local stream to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream);
      });

      // Pull tracks from remote stream, add to video stream
      this.pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream.addTrack(track);
        });
      };
      this.webcamVideoSource = this.localStream
      this.remoteVideoSource = this.remoteStream
    },

    async create_call() {
      const callDoc = this.firestore.collection('calls').doc();
      const offerCandidates = callDoc.collection('offerCandidates');
      const answerCandidates = callDoc.collection('answerCandidates');

      this.callInputValue = callDoc.id;

      // Get candidates for caller, save to db
      this.pc.onicecandidate = (event) => {
        event.candidate && offerCandidates.add(event.candidate.toJSON());
      };

      // Create offer
      const offerDescription = await this.pc.createOffer();
      await this.pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await callDoc.set({ offer });

      // Listen for remote answer
      callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (!this.pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          this.pc.setRemoteDescription(answerDescription);
        }
      });

      // When answered, add candidate to peer connection
      answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            this.pc.addIceCandidate(candidate);
          }
        });
      });
    },

    async answer_call() {
      var that = this
      const callId = that.callInputValue;
      const callDoc = that.firestore.collection('calls').doc(callId);
      const answerCandidates = callDoc.collection('answerCandidates');
      const offerCandidates = callDoc.collection('offerCandidates');

      that.pc.onicecandidate = (event) => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
      };

      const callData = (await callDoc.get()).data();

      const offerDescription = callData.offer;
      await that.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await that.pc.createAnswer();
      await that.pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await callDoc.update({ answer });

      offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          console.log(change);
          if (change.type === 'added') {
            let data = change.doc.data();
            that.pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    },

    async hangup_call() {
      // tell firebase to delete call data
      await deleteDoc(doc(this.firestore, 'calls', this.callInputValue));
      this.remoteVideoSource = null
      this.webcamVideoSource = null
      // connectedUser = null;
      // theirVideo.src = null;
      this.callInputValue = ""
      this.pc.close();
      this.pc.onicecandidate = null;
      this.pc.onaddstream = null;
      // setupPeerConnection(stream);
    }

  },
  mounted() {
    this.firestore = firebase.firestore()
  }
}

// HTML elements
// const webcamButton = document.getElementById('webcamButton')
// const webcamVideo = document.getElementById('webcamVideo')
// const callButton = document.getElementById('callButton')
// const callInput = document.getElementById('callInput')
// const answerButton = document.getElementById('answerButton')
// const remoteVideo = document.getElementById('remoteVideo')
// const hangupButton = document.getElementById('hangupButton')

// 1. Setup media sources

// 2. Create an offer
// callButton.onclick = async () => {
//   // Reference Firestore collections for signaling
//   const callDoc = firestore.collection('calls').doc();
//   const offerCandidates = callDoc.collection('offerCandidates');
//   const answerCandidates = callDoc.collection('answerCandidates');

//   callInput.value = callDoc.id;

//   // Get candidates for caller, save to db
//   pc.onicecandidate = (event) => {
//     event.candidate && offerCandidates.add(event.candidate.toJSON());
//   };

//   // Create offer
//   const offerDescription = await pc.createOffer();
//   await pc.setLocalDescription(offerDescription);

//   const offer = {
//     sdp: offerDescription.sdp,
//     type: offerDescription.type,
//   };

//   await callDoc.set({ offer });

//   // Listen for remote answer
//   callDoc.onSnapshot((snapshot) => {
//     const data = snapshot.data();
//     if (!pc.currentRemoteDescription && data?.answer) {
//       const answerDescription = new RTCSessionDescription(data.answer);
//       pc.setRemoteDescription(answerDescription);
//     }
//   });

//   // When answered, add candidate to peer connection
//   answerCandidates.onSnapshot((snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       if (change.type === 'added') {
//         const candidate = new RTCIceCandidate(change.doc.data());
//         pc.addIceCandidate(candidate);
//       }
//     });
//   });

//   hangupButton.disabled = false;
// };

// 3. Answer the call with the unique ID
// answerButton.onclick = async () => {
//       const callId = callInput.value;
//       const callDoc = firestore.collection('calls').doc(callId);
//       const answerCandidates = callDoc.collection('answerCandidates');
//       const offerCandidates = callDoc.collection('offerCandidates');

//       pc.onicecandidate = (event) => {
//         event.candidate && answerCandidates.add(event.candidate.toJSON());
//       };

//       const callData = (await callDoc.get()).data();

//       const offerDescription = callData.offer;
//       await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

//       const answerDescription = await pc.createAnswer();
//       await pc.setLocalDescription(answerDescription);

//       const answer = {
//         type: answerDescription.type,
//         sdp: answerDescription.sdp,
//       };

//       await callDoc.update({ answer });

//       offerCandidates.onSnapshot((snapshot) => {
//         snapshot.docChanges().forEach((change) => {
//           console.log(change);
//           if (change.type === 'added') {
//             let data = change.doc.data();
//             pc.addIceCandidate(new RTCIceCandidate(data));
//           }
//         });
//       });
// };
//   }
// }
</script>
