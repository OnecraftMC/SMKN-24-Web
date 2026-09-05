<script lang="ts">
  import Hero from './components/Hero.svelte';
  import Navbar from './components/Navbar.svelte';
  import Programs from './components/Programs.svelte';
  import Facilities from './components/Facilities.svelte';
  import Achievements from './components/Achievements.svelte';
  import Contact from './components/Contact.svelte';
  import Chatbot from './components/Chatbot.svelte';
  import Footer from './components/Footer.svelte';
</script>

<main class="min-h-screen bg-background text-foreground antialiased font-sans selection:bg-primary/20 selection:text-primary">
  <Navbar />
  <Hero />
  <Programs />
  <Facilities />
  <Achievements />
  <Contact />
  <Footer />
  <Chatbot />
</main>
