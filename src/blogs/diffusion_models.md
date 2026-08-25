Note: Imported from [medium](https://medium.com/better-programming/diffusion-models-ddpms-ddims-and-classifier-free-guidance-e07b297b2869)

The big models in the news are text-to-image (TTI) models like DALL-E and text-generation models like GPT-3. Image generation models started with GANs, but recently diffusion models have started showing amazing results over GANs and are now used in every TTI model you hear about, like Stable Diffusion. In this article, I want to talk about where diffusion models started and some improvements that led them to where they are today.

To go along with this article, I coded everything I will talk about in [this repo](https://github.com/gmongaras/Diffusion_models_from_scratch) if you are interested.

## A Little History

Interestingly, diffusion models have been around for a while. The earliest paper I could find referencing such a model is from 2015, which can be found [here](https://arxiv.org/abs/1503.03585). The paper showed promising results, but since GANs were starting to get big at the time, I don't think people were looking at other generative models.

Recently, GANs have been reaching their limit. As good as they are, they are very unstable and tend to run into mode collapse, where they only generate a small part of the true data distribution. StyleGAN 3 is very impressive, but I feel it marks the ending of how far GANs can go. StyleGAN 3 didn't try to make the GAN part of StyleGAN better. Rather, it improved the generator model to move it to a continuous space.

I don't think GANs will be able to move forward much more, which is why diffusion is the next generation of generative models instead of improving GANs.

Diffusion models didn't start to become noticed until the 2020s when the [DDPM (Denoising Diffusion Probabilistic Models) paper](https://arxiv.org/abs/2006.11239) was released. It showed that diffusion models can achieve very good performance in image generation. It wasn't until the paper [Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/pdf/2105.05233.pdf) which showed that diffusion models can do better than GANs with class coverage, image quality, and stability. Today, all the cool generative models like DALL-E and Stable Diffusion use diffusion models.

I want to talk about the more classic approaches to diffusion models and how they started emerging as the best generative models, which you can see today.

## DDPMs (Denoising Diffusion Probabilistic Models)

As much as I would like to go into the math of DDPMs, my brain is too smooth. Fortunately, others go into great detail about them. AI Summer has a really good article on the math [here](https://theaisummer.com/diffusion-models/) which I highly suggest looking at. The [Understanding Diffusion Models: A Unified Perspective](https://arxiv.org/pdf/2208.11970.pdf) takes a deeper look and derives all the formulas. I'll detail the main idea about DDPMs at a higher level here.

DDPMs are where the current diffusion model began. In this paper, the authors propose using a Markov Chain model, progressively adding noise to an image.

![Reverse diffusion process](/blogs/images/diffusion_models/6.webp "Reverse diffusion process")

"We also see that learning reverse process variances (by incorporating a parameterized diagonal $\Sigma_\theta(x_t)$ into the variational bound) leads to unstable training and poorer sample quality compared to fixed variances." (4.2) The DDPM authors find that it's much easier to keep the variance, $\Sigma_\theta$, constant (which we'll talk more about in the next section), and they set $\Sigma_\theta=\beta_t$ since $\beta_t$ is the noise variance at timestep $t$.

Since we know the normal distribution that got us to step $t$ using the function $q(x_t | x_{t-1})$, and we have a prediction for that distribution $p(x_{t-1} | x_t)$, we can use the [KL divergence loss](https://machinelearningmastery.com/divergence-between-probability-distributions/) between the two distributions to optimize the model.

The authors note that since they keep the variance constant, they only have to predict the mean of the distribution. Better yet, we can just predict the noise, $\epsilon$, that was sampled from the normal distribution and added to the image through the reparameterization trick. The authors found that predicting the noise was more stable. Since we just have to predict the noise added, we can use the MSE loss between the predicted noise and the actual noise added to the image.

![Model and MSE Loss](/blogs/images/diffusion_models/7.webp "Model and MSE Loss")

One may think it may be hard for a model to learn the noise since noise is random and a neural network is usually deterministic. But, if we give the model the noisy image at time $t$ and the timestep $t$, then the model can find a way to extract the noise from the noisy image, which can be used to reverse the noising process.

Interestingly the authors note that "In particular, our diffusion process setup in Section 4 causes the simplified objective to down-weight loss terms corresponding to small $t$. These terms train the network to denoise data with very small amounts of noise, so it is beneficial to down-weight them so that the network can focus on more difficult denoising tasks at larger $t$ terms." (page 5, part 3.4)

![Diffusion Generation](/blogs/images/diffusion_models/1.webp "Diffusion Generation")

A function, $q(x_t | x_{t-1})$, is used to add noise to an image one step at a time. At each step, more noise is added to the image until the image is essentially pure Gaussian noise at time $T$.

The goal is to teach a model to reverse the process so that we can generate images given the noise from a Gaussian Distribution. This way, we can generate images from the noise, just like GANs.

### The forward process

Going from time $t=0$ to $time t=T$ by progressively adding more noise to the input image is called the "forward process" (even though it's going backward in the image). The function $q$ defines the forward process and has a closed-form solution that allows us to directly model the forward process given $x_0$ (The image, $x$, at diffusion timestep $0$, the original image). The function is defined below:

![Forward process function](/blogs/images/diffusion_models/2.webp "Forward process function")

The function $q$ uses a Normal (Gaussian) Distribution to model the noising process. There is a problem with this approach, though. The distribution must be sampled $t$ times to get an image at time $t$ from time $t=0$. We could store all images for all values of $t$ in memory or load them from disk as needed, but normal values of $T$ are greater than or equal to 1,000, so we would have to store 1,000 variations of each image to train the model, which is not desired.

To solve these issues, the authors model the forward process as follows:

![Modeling the forward process using the reparameterization trick](/blogs/images/diffusion_models/3.webp "Modeling the forward process using the reparameterization trick")

This method uses the [reparameterization trick](https://sassafras13.github.io/ReparamTrick/), which allows us to model the distribution, but in a way where we can skip directly from timestep $0$ to $t$ according to $\bar{\alpha}_t$. In a way, the formula above is weighing $x_0$ (the original image) and epsilon (sampled noise from a Normal Distribution) according to $\bar{\alpha}_t$ (the noise scheduler).

$\bar{\alpha}_t$ is calculated based on a noise scheduler. The lower this value is, the more noise is added. The authors define $\alpha_t$ as $1-\beta_t$ and $\bar{\alpha}_t$ as a cumulative product of alpha values from time $0$ to time $t$.

![Normal and cumulative noise schedulers](/blogs/images/diffusion_models/4.webp "Normal and cumulative noise schedulers")

$\beta_t$ is our noise scheduler. The authors of the DDPM paper use a linear scheduler between values of $10^{-4}$ and $0.02$. At time $t=0$, the value of $\beta_t$ will be $10^{-4}$. At time $T$, $\beta_t$ will be $0.02$. These value kind of act like percentages for the amount of noise added at time $t$ relative to time $t-1$.

Note that the amount of noise added at time $t$ is not just a rate between $10^{-4}$ and $0.02$, rather we are using $\bar{\alpha}_t$. $\alpha_t$ is large at small values of $t$ and small at large values of $t$. Additionally, $\bar{\alpha}_t$ is a product of all $\alpha_t$ values from $0$ to $t$. So the noise added at time $t$ is the product of all $\alpha_t$ values, meaning the amount of noise at each timestep increases exponentially, and the percent of the original image decreases exponentially. Below is a curve showing the values of $\bar{\alpha}_t$ at all timesteps from $t=0$ to $t=T=1000$.

![Noise level according to $\bar{a}$ over time](/blogs/images/diffusion_models/5.webp "Noise level according to $\\bar{a}$ over time")

To summarize the forward process, we can use the closed-form solution of the $q$ function to add noise to an image from $x_0$ (the original image) to $x_t$ (the image at diffusion step $t$) in a single operation.

### The backward process

The backward process models the reverse of $q(x_t | x_{t-1})$ and is given by the function $p(x_{t-1} | x_t)$. Unfortunately, we cannot model this process directly as there are too many possibilities of image $x_{t-1}$ when we want to get image $x_t$.

Neural networks to the rescue! Instead, we can estimate the reverse process using a neural network. So, the function becomes $p_\theta(x_t | x_{t-1}, t)$. The $\theta$ denotes the parameters of the neural network we are optimizing to estimate the function $p$.

Intuitively, since we use a normal distribution to model the forward process, we can also use a normal distribution to model the reverse process. So, we can have the model predict the mean and variance of a normal distribution where $\mu_\theta$ is the predicted mean of the distribution and $\Sigma_\theta$ is the predicted variance or the distribution. Note that this normal distribution is predicted for all pixels; it's not one normal distribution for the entire image.

![Reverse diffusion process](/blogs/images/diffusion_models/6.webp "Reverse diffusion process")

"We also see that learning reverse process variances (by incorporating a parameterized diagonal $\Sigma_\theta(x_t)$ into the variational bound) leads to unstable training and poorer sample quality compared to fixed variances." (4.2) The DDPM authors find that it's much easier to keep the variance, $\Sigma_\theta$, constant (which we'll talk more about in the next section), and they set $\Sigma_\theta=\beta_t$ since $\beta_t$ is the noise variance at timestep $t$.

Since we know the normal distribution that got us to step $t$ using the function $q(x_t | x_{t-1})$, and we have a prediction for that distribution $p(x_{t-1} | x_t)$, we can use the [KL divergence loss](https://machinelearningmastery.com/divergence-between-probability-distributions/) between the two distributions to optimize the model.

The authors note that since they keep the variance constant, they only have to predict the mean of the distribution. Better yet, we can just predict the noise, $\epsilon$, that was sampled from the normal distribution and added to the image through the reparameterization trick. The authors found that predicting the noise was more stable. Since we just have to predict the noise added, we can use the MSE loss between the predicted noise and the actual noise added to the image.

![Model and MSE Loss](/blogs/images/diffusion_models/7.webp "Model and MSE Loss")

One may think it may be hard for a model to learn the noise since noise is random and a neural network is usually deterministic. But, if we give the model the noisy image at time $t$ and the timestep $t$, then the model can find a way to extract the noise from the noisy image, which can be used to reverse the noising process.

Interestingly the authors note that "In particular, our diffusion process setup in Section 4 causes the simplified objective to down-weight loss terms corresponding to small $t$. These terms train the network to denoise data with very small amounts of noise, so it is beneficial to down-weight them so that the network can focus on more difficult denoising tasks at larger $t$ terms." (page 5, part 3.4)

So the authors construct the loss so that the model is more biased toward learning higher values of $t$ which require it to denoise much more noise than lower values of $t$. The idea is that higher values of $t$ construct high-level features of the object and lower levels of $t$ construct more fine-grained features in the image. It's more important to get the main shape of the object right than to make the object have some sort of texture.

The reverse process is typically modeled using a U-net, as shown below:

![U-Net for extracting noise from a given image](/blogs/images/diffusion_models/8.webp "U-Net for extracting noise from a given image")

The input is the image at time, $t$, and the output is the noise within that image. Additionally, at each layer in the network, we add time information to help the model know where it's at in the diffusion process. So the input is actually the input image at time, $t$, and the timestep itself, $t$.

$p(x_{t-1} | x_t, t)$

To encode the timestep in a usable form, we can use the ["Attention is All You Need" positional encodings](https://machinelearningmastery.com/a-gentle-introduction-to-positional-encoding-in-transformer-models-part-1/). Instead of encoding the location in the sequence, we can treat the embeddings as timestep vectors where a vector represents a timestep.

![Adding time information to the model](/blogs/images/diffusion_models/9.webp "Adding time information to the model")

You can project the time vector to the number of channels and create two vectors, one to shift the intermediate image encodings and one to scale the intermediate image encodings.

The paper ["Diffusion Models Beat GANs on Image Synthesis"](https://arxiv.org/abs/2105.05233) proposes this method of adding time information and is called "Adaptive Group Normalization." Specifically, it adds the information after each *GroupNorm* layer:

![AdaGN formulation](/blogs/images/diffusion_models/10.webp "AdaGN formulation")

$y_s$ is the scale vector, and $y_b$ is the shift vector. In the paper, the authors make $y_b$ class information instead of time information to give the model knowledge of what class we want it to generate. To create the class vector, $y_b$, one can one-hot encode the class and feed the one-hot vector through a feed-forward layer. The idea of class information addition will become very important later with classifier-free guidance.

The best part about this method of adding time information is the dependence only on the image channels and the independence on the spatial image size (L/W). Since the number of channels represents the number of image features, this value will always be static. The length and width, however, can be changed, and due to the nature of convolutions, the algorithm will still work. Adding time only on the channel dimension retains this feature. So, different-sized images can be generated instead of being restricted to a single-sized image.

### Training loop

With the forward and backward processes defined, we can train the model and generate images by the following training/denoising loops:

![DDPM training loop](/blogs/images/diffusion_models/11.webp "DDPM training loop")

The left loop trains a model as follows:

1. Loop over epochs
2. Sample a batch of images from your dataset
3. Sample a value of $t$ uniformly for each image in the batch
4. Sample noise from a Gaussian Distribution with $0$ mean and unit variance.
5. Each image is noised to that timestep $t$, and the model predicts the noise in that image.
6. Use MSE loss between the sampled noise and predicted noise for each image

Note that we don't have to model the entire diffusion process as a single process, but rather we can model each individual timestep individually. Doing this will speed up training and will likely lead to a more stable training setting. If we sample the value of $t$ uniformly for each training image, the model should be able to learn how to model all values of t while learning how to model the real image distribution.

The right loop generates/samples images from noise as follows:

1. Sample noise from a Gaussian Distribution with $0$ mean and unit variance. This represents our noisy image at time $T$.
2. Loop from time $t=T$ to time $t=1$.
3. Sample new noise from a Gaussian Distribution, which will be used to move the image to the previous timestep, $t-1$.
4. Using our trained model, $\epsilon_\theta$, generate a prediction for the noise at the current timestep. Remove the noise and move the image to the previous timestep $t-1$.
5. Repeat from $2$ until $t=1$.

When all $T$ iterations are done, a new image will be generated at timestep $0$.

Part 4 of algorithm two may be a little confusing, and if you want to learn more about how it's derived, the paper [Understanding Diffusion Models: A Unified Perspective](https://arxiv.org/pdf/2208.11970.pdf) derives it at EQ 84.

![Sampling Algorithm From Line 4](/blogs/images/diffusion_models/12.webp "Sampling Algorithm From Line 4")

Intuitively, the predicted noise theoretically removes all noise from the image at timestep $t$, making the image $x_0$ when the noise is removed. This is what the first term does in the sampling algorithm. In reality, that was just a prediction, and since the image is all noise, the output won't resemble any sort of image. So, we must add more noise back to the image, but at timestep $t-1$ and do this for all timesteps. The noise is re-added in term 2.

![Diffusion Process Visualization](/blogs/images/diffusion_models/13.gif "https://learnopencv.com/image-generation-using-diffusion-models")

## Improving DDPMs

The main issue DDPMs had is the log-likelihood score (meaning the model may be able to generate high-quality images but doesn't fit the dataset very well in terms of the distribution of the real image data), which the authors of the Improved DDPM paper wanted to solve. The improving DDPMs paper had a couple of methods to improve the log-likelihood:

1. Learn $\Sigma_\theta(x_t)$, the variance of the predicted normal distribution instead of keeping it fixed at $\beta_t$.
2. Change the learning rate scheduler defined as a linear $\beta_t$ interpolation between $10^{-4}$ and $0.02$ to a $\text{cosine} \ \bar{\alpha}_t$ interpolation.

The authors had a few other changes, but I just the two main improvements still used today are shown above. The authors also increase the number of timesteps to $T=4000$ from $T=1000$. Increasing the number of steps from 1,000 to 4,000 may increase FID scores and log-likelihood scores a little, but waiting four times longer to generate an image gets really annoying.

### Learning $\Sigma_\theta$

One of the main improvements is the prediction of the variance, which the original DDPM paper decided not to do because "We also see that learning reverse process variances (by incorporating a parameterized diagonal $\Sigma_\theta(x_t)$ into the variational bound) leads to unstable training and poorer sample quality compared to fixed variances." (page 6, DDPM)

The improved DDPM paper decides to learn the variances to help improve the model's log-likelihood. However, they run into an issue. They find that the instability of the variance predictions comes from the average size of the variances and find the variances are very small. Neural networks have issues predicting very small values as it may lead to vanishing gradients. So, they predict $v$ to interpolate between the upper ($\beta_t$) and lower ($\tilde{\beta}_t$) bounds in the log domain, which appears to yield stable predictions for the variances:

![Variance parameterization](/blogs/images/diffusion_models/14.webp "Variance parameterization")

$\beta_t$ is just the normal old variance value in the forward process, whereas $\tilde{\beta_t}$ is a scaled form of $\beta_t$ based on $\bar{\alpha}_t$ and $\bar{\alpha}_{t-1}$.

![Upper bound variance formulation](/blogs/images/diffusion_models/15.webp "Upper bound variance formulation")

The original DDPM paper states that "The first choice ($\beta_t$) is optimal for $x_0 ~ N(0, I)$, and the second ($\tilde{\beta}_t$) is optimal for $x_0$ deterministically set to one point." (page 3, DDPM)

## Quick Side Note - Where Is This Derivation Coming From?

The quote above didn't make much sense, so I tried to understand it from the paper preceding the DDPM paper. The original paper has the following derivation for the upper and lower bounds:

![Upper and lower variance bounds](/blogs/images/diffusion_models/16.webp "Upper and lower variance bounds")

Note that this is in terms of the forward process, not the backward process. The $H$ functions are just the Cross-Entropy function of the system.

![Entropy of a system formulation](/blogs/images/diffusion_models/17.webp "Entropy of a system formulation")

I am going to try to explain how I understand it.

When going from step $t-1$ to step $t$, the amount of information is going to decrease, and the entropy is going to increase because the number of noise increases as per the definition of the diffusion process. Say we have a full black image for $x_0$ (represented by all $0$s in a tensor) and all Gaussian noise for $x_t$. Then when we go from step $t-1$ to step $t$, the image at step $t$ is essentially a Gaussian distribution but scaled since the image we are adding to it is all $0$s.

Since we are increasing how much the Gaussian distribution appears in the image from step $t-1$ to step $t$, the Gaussian distribution becomes more abundant. The added Gaussian noise between steps has nothing to make the image at step $t$ non-Gaussian because the original image is all zeros.

So, the difference between step $t-1$ and step $t$ is essentially a Gaussian, and since it's a Gaussian, you are adding noise between steps. You maximize the entropy between steps. This added noise creates the upper bound between the two distributions at $t-1$ and $t$ since Gaussian noise maximizes the difference between the distributions.

For any other image that's not all $0$s, the upper bound will be slightly smaller since pure Gaussian noise isn't added directly to the current timestep.

"A lower bound on the entropy difference can be established by observing that additional steps in a Markov chain do not increase the information available about the initial state in the chain, and thus do not decrease the conditional entropy of the initial state." (page 12 original paper)

The lower bound comes from a "corrected" version of the upper bound. Notice how the lower bound includes the upper bound and two extra terms:

1. The first term is the original upper bound, which is the difference between the distribution at $t-1$ and the distribution at $t$.
2. The second term is the difference between $x_0$, the original distribution, and the previous distribution at $t-1$.
3. The third term is the difference between $x_0$, the original distribution, and the new distribution at $t$.

Adding 1. and 2. gives you the total difference between $x_0$ and $x_{t-1}$ and the difference between $x_{t-1}$ and $x_t$. Then we remove the actual difference between $x_0$ and $x_t$ to give us the final result, the difference between $x_{t-1}$ and $x_t$. The idea is that any "information" the diffusion process "adds" to the current distribution being generated could be added somewhere from time $t$ to time $t-1$, which may alter the real KL divergence value according to the entire diffusion process. We want to remove this "information" since any image we generate has no more "information" than the original image at $x_0$. That's what the lower bound represents.

So, the upper bound is the immediate difference between the distribution $x_{t-1}$ and the distribution $x_t$, while the lower bound is corrected so that "information" that could have come from noise isn't added to this difference.

The difference between distributions is a great way to model the variance because the variance at any step should model how much the distribution changes between timesteps. That's exactly what the upper and lower bounds model is.
