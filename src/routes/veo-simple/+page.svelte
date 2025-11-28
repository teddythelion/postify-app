<script lang="ts">
    let prompt = '';
    let duration = 5;
    let operation = '';
    let video = '';
    let status = '';

    async function generate() {
        status = 'Generating...';
        console.log("in generation");
        const res = await fetch('/api/veo2-simple/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, duration })
        });
        const data = await res.json();
        
        if (data.error) {
            status = `Error: ${data.error}`;
            return;
        }
        
        operation = data.operation;
        status = 'Waiting 30 seconds...';
        setTimeout(poll, 30000);
    }

    async function poll() {
        status = 'Checking...';
        const res = await fetch('/api/veo2-simple/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation })
        });
        const data = await res.json();
        
        if (data.done) {
            video = data.video;
            status = 'Done!';
        } else {
            status = 'Still processing...';
            setTimeout(poll, 15000);
        }
    }
</script>

<div style="padding: 40px; max-width: 600px; margin: 0 auto;">
    <h1>Veo 2 Simple</h1>
    
    <textarea 
        bind:value={prompt} 
        placeholder="Describe your video..." 
        rows="4" 
        style="width: 100%; padding: 10px; margin: 20px 0;"
    ></textarea>
    
    <div style="margin: 20px 0;">
        <label>Duration: 
            <select bind:value={duration} style="padding: 5px;">
                <option value={5}>5 seconds</option>
                <option value={6}>6 seconds</option>
                <option value={8}>8 seconds</option>
            </select>
        </label>
    </div>
    
    <button on:click={generate} style="padding: 10px 20px; font-size: 16px;">
        Generate Video
    </button>
    
    <p style="margin: 20px 0;">{status}</p>
    
    {#if video}
        <video src={video} controls style="width: 100%; margin-top: 20px;">
            <track kind="captions" src="" label="English" srclang="en" />
        </video>
        <a href={video} download style="display: block; margin-top: 10px;">Download</a>
    {/if}
</div>