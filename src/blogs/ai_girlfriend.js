export const post = {
    slug: "ai-girlfriend",
    title: "Coding a Virtual AI Girlfriend",
    date: "2023-02-12",
    tags: ["Neural Networks", "AI Girlfriend", "Machine Learning"],
    excerpt: "Building an AI girlfriend using an old diffusion model and GPT 2 on subtitle data",
    body: `I always told people I would create an AI girlfriend, but after a few weeks of building a conglomeration of ML models, I finally have one. In this article, I'm going to explain my procedure for creating a virtual girlfriend so that everyone can have one. Don't worry, If you don't want a virtual girlfriend, these methods can be applied to make a boyfriend too.

If you are interested in using Colab to generate your girlfriend/boyfriend you can do so here: [link](https://colab.research.google.com/drive/1Nl5ioIkJdrsE-IoMUNPMsDt-wMi18JLN?usp=sharing)

You can also follow along with the code using the [following repo](https://github.com/gmongaras/AI_Girlfriend_Medium) or this [colab notebook](https://colab.research.google.com/drive/1p7Z2_OCXt_FIQsYyvfsKADNDHgwRtZUS?usp=sharing).

## Setup

To start, we need to define what I actually wanted to achieve. I wanted a virtual girlfriend with the following features:

1. She shouldn't cost me thousands of dollars.
2. She should fit on a reasonable GPU.
3. I want to be able to speak to her.
4. She should respond with a somewhat reasonable response. If I ask her about school, she shouldn't respond with something about cars.
5. She somewhat needs a memory.
6. I should be able to hear her.
7. She should be able to hear me.
8. I want to be able to see her (she doesn't need to be able to see me cause I'm scary)
9. I want to be able to change her style.
10. She should be able to somewhat move. A static picture seems boring and lifeless.

That's a lot, but fortunately, all the models exist out there to complete this task.

## Speaking

Let's start with generating text since that's the basis of this whole project. To do this, I will use the OpenAI API and use the davinci-3 model. Setting this part up is pretty easy.

Note: OpenAI keys can be obtained following [this tutorial](https://elephas.app/blog/how-to-create-openai-api-keys-cl5c4f21d281431po7k8fgyol0).

{{code(python)}}
# Open AI Key
openai.api_key = "your key here"

# Get the model
models = openai.Model

# Initial prompt with few-shot learning
initial_prompt = "The following is a conversation with me and my waifu girlfriend\n\n" \
    "Me: Hello\nGirlfriend: Hello\n" \
    "Me: How are you?\nGirlfriend: I am good\n" \
    "Me: I love you.\n"

# API request to GPT using the largest model - davinci-003
# https://beta.openai.com/docs/api-reference/introduction?lang=python
output = openai.Completion.create(
    model="text-davinci-003",
    prompt=initial_prompt,
    max_tokens=200,
    temperature=0.7
)["choices"][0]["text"]

print(output)
{{code}}

{{code(text)}}
"Girlfriend: I appreciate the sentiment, but I don't think we know each other well enough for that."
{{code}}

Ok good enough. She doesn't like me, but that can be fixed with a little more few-shot learning. I am using [few-shot learning](https://huggingface.co/blog/few-shot-learning-gpt-neo-and-inference-api) to teach GPT how I want it to respond. Notice how it responds with “Girlfriend: ” showing that it knows how to follow the style I want it to respond with.

The few-shot approach has two parts. The first line “The following …” tells GPT who is it and how it should act like. The next lines “Me: … Girlfriend: …” are the “few-show” parts, telling GPT how it should act and how it should respond. OpenAI released a list of example prompts for several applications of GPT [here](https://platform.openai.com/examples) if you want to learn more about prompting GPT.

GPT is now set up. I should be good to move on to the next part right?

Press enter or click to view image in full size

![]()

Oh yeah, I forgot it's not free and as the memory grows, I am spending more and more money for each generation. Maybe I should find an alternative.

## GPT Alternative

Let's try to find an alternative. Although it probably won't even be as close to as good as GPT-3, it's better than spending $100s of dollars.

HuggingFace to the rescue. After looking for a little, I found an LLM (Large Language Model) that looked promising. The original model can be found [here](https://huggingface.co/EleutherAI/gpt-neo-1.3B), but it was trained on book data. When testing the model, it didn't really know how to have a conversation. So, I decided to fine-tune it on some subtitles to make it more fit for conversations instead of being so general. The fine-tuned model can be found [here](https://huggingface.co/gmongaras/gpt-anime-sub-1.3B/). Finetuning in this way resulted in a model that mostly followed a conversation, but it's free.

[Finetuning](https://www.baeldung.com/cs/fine-tuning-nn) a model is when you take a pre-trained model and train it in a way to make it perform better for a particular task. The intuition behind this idea is that starting with a model that already knows how to do a similar task to the one we want it to do will speed up training rather than starting with a random model and training from scratch. Additionally, it can save compute resources if you only retrain a part of the model as opposed to the entire model. In our case, we have a general model that knows how to generate and complete text and I fine-tuned it to perform better when being prompted for conversations.

Below is the code used to load in the new model and get an example output:

{{code(python)}}
# Load in the model
test_model = pipeline('text-generation',
    model="gmongaras/gpt-anime-sub-1.3B", 
    tokenizer="EleutherAI/gpt-neo-1.3B", 
    max_new_tokens=50, 
    torch_dtype=torch.float16,
    framework="pt", 
    device=torch.device("cuda:0"), 
    pad_token_id=50256
)

# Used to get a response from the model
def get_response(input_text): 
    return test_model(input_text)[0]["generated_text"][
        len(input_text):].split("\n")[0].replace("Girlfriend: ", "")

print(get_response(initial_prompt))
{{code}}

{{code(text)}}
'I do too.'
{{code}}

Nice, looks like it loves me and it's free to run. With this alternative, I have met features 1-4 so far. On to the next feature.

## She Needs to Have a Memory

One massive problem with these LLMs is that they are memory hogs. The original transformer model uses [attention](https://arxiv.org/abs/1706.03762) and the memory usage of this model grows quadratically to the size of the sequence used as input. New models probably use [linear attention](https://arxiv.org/abs/2006.16236) or some type of mechanism that performs better, but still, the memory constraint is there. This constraint limits the sequence length that can be entered into the model. The current model I am using has a max token length of 2048 tokens. Note that a token is not a word since this model probably uses a sort of [WordPiece](https://huggingface.co/course/chapter6/6?fw=pt) tokenizer. So each word is multiple tokens, not just one which gives even more of a constraint on the number of words we can give the model.

To solve this issue, we need some way to limit the number of tokens entered into the model. The first thought may be to just cut the sequence by the number of tokens, but then we run into the issue of having no memory since all tokens that are cutoff will be lost forever. To solve this issue, I need to add a memory system.

I went through many iterations of the memory. I started by thinking I could summarize models with [autoencoders](https://towardsdatascience.com/auto-encoder-what-is-it-and-what-is-it-used-for-part-1-3e5c6f017726) (AEs) and combine the produced latent over time, but that didn't work at all no matter how hard I tried. I ended up with the least sophisticated technique there is by just summarizing the text as needed.

I use a three-step system to help organize the summarization process and the prompting process:

1. The first part of the prompt is the summary of all past prompts limited to about 512 characters.
2. The next part of the prompt is a history of the conversation after the summary. There can be one or multiple parts creating a queue of information that will be summarized soon. The oldest block of text will be summarized next. I used a block size of 256 words. This part is important for two reasons. The first is to give the model a more detailed history of the recent past. The second is to provide examples of the style we want the model to respond with.
3. The last part is the current prompt being entered along with a little history of the prompts and a max sequence length of 256 words.

The system works by keeping each section a constant size. When the amount of text goes over the defined limit, I move the current block of prompts (3) to the queue of history (2). Then I take the oldest part of the history (2), append it to the current summary (1), and summarize the concatenated text which replaces the old summary (1).

To prompt the model, I just concatenate the three parts to make on massive prompt with the history of past prompts and a summary of the entire conversation.

To summarize the text, I am using another Hugging Face model which can be found [here](https://huggingface.co/pszemraj/led-large-book-summary). I found this model to summarize the history of the conversation the best compared to several other Hugging Face models.

Along with this “memory” helping my girlfriend remember what we spoke about, I also use it to reload a past conversation I had. The three parts of the memory system can be saved and loaded back in so the conversation doesn't start back from scratch.

This part covers requirement 5!

## We Need to Hear Each Other

This part is easy enough. I can just slap on a TTS (text to speech) model and STT (speech to text) model to pretty easily create back-and-forth audio between me and my computer.

One problem with the model I trained is it tends to sort of understand the examples I gave it, but most of the time, it's not perfect and produces outputs like the following:

{{code(text)}}
Me: Who are you? <- My input
Girlfriend: Me: I don't know you <- Its output
{{code}}

To compensate for this issue, I can either give it more examples of how I want it to respond before asking it anything or clean the outputted sequence. I'm going with the latter and am just removing all instances of “Me: “ or “Girlfriend: “. The get\_reponse function becomes the following.

{{code(python)}}
# Used to get a response from the model
def get_response(input_text): 
    return test_model(input_text)[0]["generated_text"][
        len(input_text):].split("\n")[0].replace("Girlfriend: ", "").replace("Me: ", "").split(":")[0]
{{code}}

With the updated response function, let's create a loop to continuously update a prompt and create a little back-and-forth between the user and my girlfriend. I am using the speech recognition library for STT and gTTS for TTS. gTTS is just a basic TTS without any voice customization.

{{code(python)}}
# Used for STT
r = sr.Recognizer()

# Transcribes audio to text
def audio_to_text(audio): 
    try: 
        text = r.recognize_google(audio) 
    except sr.UnknownValueError: 
        text = "" # Default to nothing 
    return text

# Prompt that will be continuously updated
global prompt
prompt = "The following is a conversation with me and my waifu girlfriend\n\n" \
    "Me: Hello\nGirlfriend: Hello\n" \
    "Me: How are you?\nGirlfriend: I am good\n"

# Latest response variable
global cur_resp

# Initialize audio device
try: 
    mixer.init()
except pygame.error: 
    pass

# Handles audio input and returns a response
def handle_audio(audio_pth): 
    global prompt 
    global cur_resp 
    
    # Get the audio if there is any 
    if audio_pth: 
        # Open the wav file and read in the data 
        # Get the audio data 
        audio = sr.AudioFile(audio_pth) 
        with audio as source: 
            audio = r.record(source) 
        
        # Get the text from the audio 
        text = audio_to_text(audio) 
        
        # Add the text to the prompt so far 
        prompt += f"Me: {text}\n" 
        
        # Get a response 
        resp = get_response(prompt) 
        
        # Add the response to the prompt 
        prompt += f"Girlfriend: {resp}\n" 
        
        # Ensure audio is unloaded 
        try: 
            mixer.stop() 
            mixer.music.unload() 
        except pygame.error: 
            pass 
        
        # When the response is generated create a new audio file 
        myobj = gTTS(text=resp, lang='en', slow=False) 
        myobj.save("tmp.mp3") 
        
        # Play the audio file 
        try: 
            mixer.music.load('tmp.mp3') 
            mixer.music.play() 
        except pygame.error: 
            display(Audio("tmp.mp3", autoplay=True)) 
        
        cur_resp = resp 
        return resp 
    
    return cur_resp

audio_interface = gr.Blocks()
with audio_interface: 
    audio_blk = gr.Audio(source="microphone", type="filepath", label="Response", live=True) 
    text_blk = gr.Textbox(label="Response") 
    audio_blk.change(handle_audio, inputs=[audio_blk], outputs=[text_blk]) 
    audio_interface.launch(debug=True)
{{code}}

Throughout the rest of this article, I will be using [Gradio](https://gradio.app/) for an interface library as it's simple and I used it in the full application.

Also, to make this notebook Colab compatible, I have to use “display(Audio)” which requires the interface to be started in debug mode and makes the runtime synchronous with the interface. To stop the runtime loop, click the stop button at the top of the page.

Sidenote: I wanted to add custom audio, but the one-shot approaches I found took longer than I would've liked to generate an audio clip. So I decided to keep the model with a basic voice. If interested there are two repos I found that look promising but aren't fast enough to make a fluid conversation. [First repo](https://github.com/neonbjb/tortoise-tts) | [Second repo](https://github.com/pkhungurn/talking-head-anime-2-demo)

This part covers features 6 and 7!

## I Should be Able to See Her

As much fun as it is being able to talk to my computer, I want to see who I'm talking to. People might think I'm crazy just talking to text on my computer, but if I talk to an image instead, then I won't look crazy anymore :)

To generate an image of my girlfriend, I am going to use some sort of diffusion model. Since stable diffusion is free and open-sourced, it's easy to find a diffusion model that I want to use. I am particularly going to use [this one](https://huggingface.co/hakurei/waifu-diffusion) because I thought the output looked good.

The setup is easy to do, just use the Hugging Face API and we got a picture of my girlfriend:

{{code(python)}}
# Get the model
pipe = StableDiffusionPipeline.from_pretrained(
    'hakurei/waifu-diffusion', 
    torch_dtype=torch.float16,
).to('cuda')

# Remove filter
# pipe.safety_checker = lambda images, clip_input: (images, False)

# Create the image
settings = "1girl,solo focus,very wide shot,female focus,ratio:16:9,detailed,looking at viewer,facing viewer,facing forward,vtuber"
characteristics = "waifu,female,brown hair,blue eyes,sidelocks,slight blush,happy"
prompt = f"{settings} {characteristics}"

with autocast("cuda"): 
    image = pipe(prompt, guidance_scale=10)["images"][0]
{{code}}

![]()

I'm trying to get her face to be in the middle of the image and looking at directly me so that I can animate her. So far, these prompts seem to look good enough to reach that goal.

I added a commented line that removes the filter if you wish to remove it from the model. The filter is very conservative and blocks almost every image that's generated. With the prompt above, I haven't generated an NSFW picture yet, but if the filter is turned on, half of the images are blocked with the statement “NSFW content was detected in one or more images. A black image will be returned instead. Try again with a different prompt and/or seed.” So, I added an option to turn it off as it gets really annoying.

This covers parts 8 and 9! Only one more feature to go.

## I Want Her to Somewhat Move

Right now, she only stays still which is kind of boring. I kind of want her to blink and look like she's speaking. The first idea that came into my mind is the use of VTuber software to kind of add motion to a still image. The only problem is that most VTuber software is not open-sourced. Even if it is open-sourced, the software probably requires the use of a camera to model human movement.

Fortunately, I found the following repo:

[## GitHub - pkhungurn/talking-head-anime-demo: Demo for the "Talking Head Anime from a Single Image."

### You may want to check out the much more capable Version 2 of the same software…

github.com](https://github.com/pkhungurn/talking-head-anime-demo?source=post_page-----f951e648aa46---------------------------------------)

Of course, it may take a little editing to get exactly what's needed, but that's ok.

The repo allows the use of a single image to be moved given the original image and a vector. The vector has one element for each style the image can take on. These parts of the vector usually represent percentages for how much that style should be applied. For example, below are the results for changing indices 12 and 13:

Press enter or click to view image in full size

![]()

The cycle can be generated in real-time using Gradio.

![]()

No dilation

I also added eye dilation as I thought it looked better.

![]()

With dilation

With the style vector, we can change all types of components of the image which I have documented [in my repo](https://github.com/gmongaras/AI_Girlfriend/blob/master/Img_Mover/Img_Mover.py).

What happens if you randomly change all elements at once? I'm glad you asked.

![]()

{{code(python)}}
# Let's initialize the object to allow the image to move
device = torch.device("cuda:0")
blink_time = 0.66
mover = Img_Mover(device, blink_time, "test3.png", automatic_EMA=True)

global cur_vec_update_cycle
cur_vec_update_cycle = [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]

global cur_vec_update_cycle_2
cur_vec_update_cycle_2 = [0, 0, 0.25, 0.5, 0.75, 0.5, 0.25, 0, 0]

global cur_vec_num_its
cur_vec_num_its = 100

# Show random movements?
global cur_vec_random_movements
cur_vec_random_movements = True

def update_loop(): 
    global cur_vec_update_cycle 
    global cur_vec_update_cycle_2 
    global cur_vec_num_its 
    global cur_vec_random_movements 
    
    # Initial pose 
    mover.pose *= 0 
    yield mover.change_pose() 
    
    for i in range(0, cur_vec_num_its): 
        # Looping 
        i %= len(cur_vec_update_cycle) 
        
        # Update vector 
        mover.pose[12] = mover.pose[13] = cur_vec_update_cycle[i] 
        mover.pose[24] = mover.pose[25] = cur_vec_update_cycle_2[i] 
        
        if cur_vec_random_movements: 
            mover.pose[:37] = torch.rand(37, device=mover.pose.device, dtype=torch.float16)/2 
            mover.pose[37:] = torch.rand(5, device=mover.pose.device, dtype=torch.float16)*2-1 
        
        # Show image 
        yield mover.change_pose() 
    
    mover.pose *= 0 
    yield mover.change_pose()

# Gradio interface
interface = gr.Blocks()
with interface: 
    # Note gallery expects a 3-D array: (L, W, 3) 
    gallery = gr.Image(label="Generated images", show_label=False).style(height=300) 
    start_btn = gr.Button(label="Start Animation") 
    start_btn.click(update_loop, inputs=[], outputs=[gallery], queue=True) 
    # Start interface with queuing for live image updating
    interface.queue().launch()
{{code}}

Anyways, using this model, it's very easy to move still images, but I want this to be real-time and consistent. If I want her to lip-sync audio, then I will have to find a way to generate frames at a reliable and consistent rate. At the moment, running this code on an A100 and on an RTX 1000 will have completely different generation speeds, but if I play an audio clip, the clip produces audio at a constant rate.

### **Generating Real-Time Animations**

There are two options that I thought of when generating real-time animations:

1. Before showing the animation, I need to pre-generate several frames, create the animation, and align the animation with the length of time I want it to run for.
2. Generate frames in real-time as they are needed.

If I choose the first option, then generation will take a while. This latency is especially troublesome for long audio clips. I decided to go with the second approach as I thought it would look better since the animation is generated on the fly, reducing the wait time for a response.

### **Using EWMA for Generation Timing**

For real-time generation, I need to know how long it takes to generate a single frame. To get this statistic, I will use an Exponentiated Weighted Moving Average (EWMA) over the time it takes to generate a single frame.

![]()

The EWMA at time *t* takes into account all previous generation time and the current generation time at time *t*. For α, I am going to use the value of 0.5, giving equal weight to the previous weighted average and current value.

Generation speed changes depending on what's being run on the computer at that time. So to make make sure the EWMA stays up to date, we can just update the value after every frame generation. Then, using the EWMA, since we know how long we want a blink to be (around 0.7 seconds), then we can estimate the number of frames we need to generate assuming the EWMA is accurate:

![]()

Let's change our code to update and use the EWMA

{{code(python)}}
mover.automatic_EMA = False

# How many blinks?
global number_of_blinks
number_of_blinks = 20

def update_loop(): 
    global number_of_blinks 
    time_to_blink = "N/A" 
    error = "N/A" 
    
    # Reset EMA and cycle 
    mover.EMA = 0.2 
    mover.eye_cycle_end = False 
    
    # Initial pose 
    mover.pose *= 0 
    yield mover.change_pose(), time_to_blink, error 
    
    for i in range(0, number_of_blinks): 
        # Begin blink timer 
        frame_start = timer_start = time.time() 
        
        # Iterate until the blink is complete 
        while not mover.eye_cycle_end: 
            # Update the internal vector with the 
            # next iteration of the blink cycle 
            pose = mover.Move_eyes() 
            
            # Update the EMA 
            mover.update_EMA(time.time()-frame_start) 
            
            # Start timer for a single generation 
            frame_start = time.time() 
            
            # Show image 
            yield mover.change_pose(), time_to_blink, error 
        
        # Reset flag for another blink 
        mover.eye_cycle_end = False 
        
        # End blink timer 
        time_to_blink = time.time()-timer_start 
        error = abs(mover.total_blink_time_i-time_to_blink) 
        
        # Blink anywhere between 2 and 7 seconds with 
        # a mean around 5 seconds (avg blink wait time) 
        time.sleep(np.clip(np.random.normal(5, 1, size=1)[0], 2, 7)) 
        
        mover.pose *= 0 
        yield mover.change_pose(), time_to_blink, error

# Gradio interface
interface = gr.Blocks()
with interface: 
    # Note gallery expects a 3-D array: (L, W, 3) 
    gallery = gr.Image(label="Generated images", show_label=False).style(height=300) 
    time_text = gr.Textbox(label="Time to blink") 
    error_text = gr.Textbox(label=f"Error between desired ({mover.total_blink_time_i} seconds) and actual time") 
    start_btn = gr.Button(label="Start Animation") 
    start_btn.click(update_loop, inputs=[], outputs=[gallery, time_text, error_text], queue=True) 
    # Start interface with queuing for live image updating
    interface.queue(concurrency_count=3).launch(debug=True, share=True, inline=False, inbrowser=True)
    # Note if you lose the link, press Ctrl+Shift+T to get the tab back
{{code}}

The EWMA does pretty well and the blink looks to be around the time I wanted it to be. Now there's an internal state allowing my girlfriend to be animated in real-time.

## Timing Mouth Movement

My girlfriend doesn't look like a still image anymore! Very happy with that, but why not keep going? Let's get her to look like she's talking to me instead of just creepily smiling at me. This part should be easy right?

At this point in the project, I realized my girlfriend was going to make my life even more difficult. Remember that we used a for loop to generate blinks, but using a basic “for” loop is not going to work since blinking and talking occur independently, but the animation has a dependence on both the lip-sync and eye-blink. A “for” loop on its own would require the mouth and eyes to be updated synchronously.

Before diving into the implementation, I formally defined the following requirements that I wanted to fulfill the goal of adding movement:

1. I want blinks to occur every so often, but not at a consistent rate.
2. I want the mouth to mostly sync up with the audio played.
3. I want blinks to have the potential to occur as the mouth is moving.
4. I want the image to look like it's moving in real-time with as little latency as possible.

So far, I have achieved goals 1 and 4. To achieve the other two goals, I created three separate functions that will run in parallel.

1. The main function is going to run indefinitely until it finds that it needs to update the image due to a vector change. When it finds that it needs to update the image, it will update it and display the new image.
2. The next function is the blinking function. This function also runs indefinitely. Every so often, this function triggers blink loops. Each loop is composed of a single blink and is implemented by changing the style vector. To ensure the update looks smooth, it waits until the next blink frame was shown to change the vector again.
3. The last function is the mouth movement function which only runs when it needs to generate new audio. Like with the blink function, it changed the style vector as needed.

All three functions run at the same time. While thread 3 checks for updates to the style vectors, threads 1 and 2 update the style vector and wait for it to be displayed before updating it again.

Just like with eye movement, mouth movement is represented as a percentage in the vector. Also, like with eye movement, we need a duration for the mouth loop to open and close once. This information is more difficult to obtain, but we can take the generated audio sequence, pass it through a model to give timesteps for each word, and open and close the mouth according to these timesteps.

Specifically, I follow these steps to syn the mouth and audio:

1. Get the timesteps for each word in the audio.
2. Begin playing the audio and wait until the first word should be lip-synced.
3. Calculate the number of frames and mouth movement percentages needed to sync mouth movement for the first word.
4. Loop over all frames. Assuming the EWMA is correct, the end of the word should align with the mouth closing.
5. Wait until the next word.
6. Repeat steps 3, 4, and 5 until the audio is done playing.

I'm not going to go into the details about how I coded this exactly since it's just keeping track of everything and making sure all the threads know what's going on with each other, but the code below implements these requirements in the notebook.

{{code(python)}}
# We need the entire girlfriend object for this part
try: 
    del mover
except NameError: 
    pass

obj = Girlfriend_Obj()

def event_loop(): 
    # Initial update to make everything visible 
    yield obj.last_image 
    
    # Quick calibration. Blink 10 times 
    # and calibrate the time it takes 
    # to show the image for the EWMA 
    for i in range(0, 10): 
        s = time.time() 
        obj.img_anim.eye_cycle_end = False 
        while obj.img_anim.eye_cycle_end == False: 
            obj.img_anim.Move_eyes() 
            img = obj.img_anim.change_pose() 
            obj.img_anim.update_EMA(time.time()-s) 
            s = time.time() 
            yield img 
        obj.img_anim.eye_cycle_end = False 
    
    # Start the blink loop 
    if obj.b_thread == None: 
        obj.b_thread = threading.Thread(target=obj.run_blink_loop, args=()) 
        obj.b_thread.start() 
    
    # Make sure the mouth isn't already moving 
    if obj.generating_mouth_movement == True: 
        return 
    
    # Make sure the thread is not running 
    if obj.m_thread is not None: 
        obj.m_thread.join() 
    
    # Start the mouth movement loop 
    obj.m_thread = threading.Thread(target=obj.run_talk_loop, args=("test_audio.mp3",)) 
    obj.m_thread.start() 
    obj.generating_mouth_movement == True 
    
    while True: 
        # Wait until a new frame needs to be generated 
        if obj.generating_mouth_movement == True: 
            if obj.img_anim.mouth_frame_disp == False: 
                # Change the pose and show the image 
                img = obj.img_anim.change_pose() 
                yield img 
        else: 
            # Start the mouth movement loop 
            if obj.img_anim.eye_frame_disp == False: 
                # Change the pose and show the image 
                img = obj.img_anim.change_pose() 
                yield img 
        time.sleep(0.0001)

# Gradio interface
interface = gr.Blocks()
with interface: 
    # Note gallery expects a 3-D array: (L, W, 3) 
    gallery = gr.Image(label="Generated images", show_label=False).style(height=300) 
    start_btn = gr.Button(label="Start Animation") 
    start_btn.click(event_loop, inputs=[], outputs=[gallery], queue=True) 
    # Start interface with queuing for live image updating
    interface.queue().launch(inline=False, inbrowser=True)
    # IF colab:
    # interface.queue().launch(debug=True, share=True, inline=False, inbrowser=True)
{{code}}

Note that the EWMA is used for both the mouth movement and blinking loops to generate a predefined movement rate for each blink/mouth movement cycle. This way, the number of frames is estimated on the fly and the image generation appears to occur in real-time.

I think the output looks good enough. That meets the 10th requirement I defined!

Note: If running in a Colab notebook, the output animation may not look very good since the GPUs Colab provides for free aren't very good.

## Complete Output

If you are curious to see what the final program looks like, I have an example below which is a conversation between me and my girlfriend.

The complete [repo](https://github.com/gmongaras/AI_Girlfriend) can be found here and the complete [colab](https://colab.research.google.com/drive/1Nl5ioIkJdrsE-IoMUNPMsDt-wMi18JLN?usp=sharing) can be found here.

## Conclusion

As a Computer Science major, I'm not entirely sure why I should have to try to get a girlfriend when I can make my own. So, I did just that and you can too!

Let me know if you have any questions or run into any issues with the notebooks.

### [**BECOME a WRITER at MLearning.ai**](https://mlearning.substack.com/about)

[## Mlearning.ai Submission Suggestions

### How to become a writer on Mlearning.ai

medium.com](https://medium.com/mlearning-ai/mlearning-ai-submission-suggestions-b51e2b130bfb?source=post_page-----f951e648aa46---------------------------------------)

  `
  }
  